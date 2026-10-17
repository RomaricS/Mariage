import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { app, db } from '../firebase';
import type { Guest, Invite, Party } from '../lib/model';
import {
  buildHouseholds,
  inviteIsStale,
  inviteShape,
  makeToken,
  needsResponseSync,
  responseToGuestWrites,
  type Household,
} from '../lib/sync';

const auth = getAuth(app);

export type AuthState = 'loading' | 'signedOut' | 'notAllowed' | 'rulesBlocked' | 'admin';

interface AdminData {
  auth: AuthState;
  user: User | null;
  workspaceId: string | null;
  loaded: boolean;
  error: string | null;
  guests: Guest[];
  parties: Party[];
  households: Household[];
  /** keyed by householdKey */
  invites: Map<string, Invite>;
}

const AdminContext = createContext<AdminData | null>(null);

/** Plain-language help for the sign-in errors people actually hit during setup. */
export function signInHelp(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const host = window.location.hostname;
  switch (code) {
    case 'auth/unauthorized-domain':
      return `This address (${host}) isn’t allowed to sign in yet. Firebase console → Authentication → Settings → Authorized domains → Add domain → ${host}.`;
    case 'auth/operation-not-allowed':
      return 'Google sign-in is turned off. Firebase console → Authentication → Sign-in method → Google → Enable → Save.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google window was closed before finishing. Try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return `Sign-in failed${code ? ` (${code})` : ''}. ${(e as Error)?.message ?? ''}`;
  }
}

/** Popup first; if the browser blocks popups (common on phones), fall back to a full-page redirect. */
export async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

/** Errors from a redirect sign-in surface on the page we come back to. */
export const redirectResult = () => getRedirectResult(auth);
export const signOutAdmin = () => signOut(auth);

export function saveWorkspaceId(id: string) {
  return setDoc(doc(db, 'admin', 'settings'), { workspaceId: id.trim() }, { merge: true });
}

const wsCol = (ws: string, name: 'guests' | 'parties') => collection(db, 'workspaces', ws, name);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [parties, setParties] = useState<Party[] | null>(null);
  const [inviteList, setInviteList] = useState<Invite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (!u?.email) return setAuthState('signedOut');
        try {
          const allowed = await getDoc(doc(db, 'admins', u.email));
          setAuthState(allowed.exists() ? 'admin' : 'notAllowed');
        } catch (e) {
          // permission-denied here means this repo's firestore.rules aren't deployed yet.
          setAuthState((e as { code?: string }).code === 'permission-denied' ? 'rulesBlocked' : 'notAllowed');
        }
      }),
    [],
  );

  useEffect(() => {
    if (authState !== 'admin') return;
    const unsubs = [
      onSnapshot(
        doc(db, 'admin', 'settings'),
        (s) => setWorkspaceId((s.data()?.workspaceId as string) || null),
        (e) => setError(e.message),
      ),
      onSnapshot(
        collection(db, 'invites'),
        (qs) => setInviteList(qs.docs.map((d) => ({ ...(d.data() as Invite), token: d.id }))),
        (e) => setError(e.message),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authState]);

  useEffect(() => {
    if (authState !== 'admin' || !workspaceId) return;
    const unsubs = [
      onSnapshot(wsCol(workspaceId, 'guests'), (qs) => setGuests(qs.docs.map((d) => d.data() as Guest)), (e) => setError(e.message)),
      onSnapshot(wsCol(workspaceId, 'parties'), (qs) => setParties(qs.docs.map((d) => d.data() as Party)), (e) => setError(e.message)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authState, workspaceId]);

  const households = useMemo(() => buildHouseholds(guests ?? [], parties ?? []), [guests, parties]);
  const invites = useMemo(() => {
    const m = new Map<string, Invite>();
    for (const inv of inviteList ?? []) {
      const prev = m.get(inv.householdKey);
      if (!prev || inv.createdAt > prev.createdAt) m.set(inv.householdKey, inv);
    }
    return m;
  }, [inviteList]);
  const loaded = guests !== null && parties !== null && inviteList !== null;

  // Keep invites in step with the guest list, and copy RSVP answers back into it.
  const syncing = useRef(false);
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    if (!loaded || !workspaceId || syncing.current) return;
    const ws = workspaceId;
    const batch = writeBatch(db);
    let ops = 0;
    for (const h of households) {
      const inv = invites.get(h.key);
      if (!inv) {
        const token = makeToken();
        batch.set(doc(db, 'invites', token), { ...inviteShape(h), createdAt: Date.now(), openCount: 0, response: null });
        ops++;
        continue;
      }
      if (inviteIsStale(inv, h)) {
        batch.update(doc(db, 'invites', inv.token), inviteShape(h));
        ops++;
      }
      if (needsResponseSync(inv) && inv.response) {
        for (const w of responseToGuestWrites(inv, h, inv.response, guests ?? [])) {
          const ref = doc(wsCol(ws, 'guests'), w.id);
          if (w.create) batch.set(ref, w.data);
          else batch.update(ref, w.data);
          ops++;
        }
        batch.update(doc(db, 'invites', inv.token), { syncedAt: inv.response.submittedAt });
        ops++;
      }
      if (ops > 400) break;
    }
    if (!ops) return;
    syncing.current = true;
    batch.commit().then(
      () => {
        syncing.current = false;
        setSyncTick((t) => t + 1);
      },
      (e: Error) => setError(e.message), // stays locked: no retry loop on a rules error
    );
  }, [loaded, workspaceId, households, invites, guests, syncTick]);

  const value: AdminData = {
    auth: authState,
    user,
    workspaceId,
    loaded,
    error,
    guests: guests ?? [],
    parties: parties ?? [],
    households,
    invites,
  };
  return createElement(AdminContext.Provider, { value }, children);
}

export function useAdmin(): AdminData {
  const v = useContext(AdminContext);
  if (!v) throw new Error('useAdmin outside AdminProvider');
  return v;
}

/* ---------- guest list edits (same documents the GuestList app uses) ---------- */

const uid = () => crypto.randomUUID();

export async function setPlusOne(ws: string, h: Household, allowed: boolean) {
  const batch = writeBatch(db);
  h.members.forEach((m, i) => {
    batch.update(doc(wsCol(ws, 'guests'), m.id), { plusOne: allowed && i === 0 });
  });
  await batch.commit();
}

export async function addHousehold(ws: string, names: string[], side: string) {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (!clean.length) return;
  const batch = writeBatch(db);
  let partyId: string | null = null;
  if (clean.length > 1) {
    partyId = uid();
    batch.set(doc(wsCol(ws, 'parties'), partyId), {
      id: partyId,
      name: clean.join(' & '),
      type: clean.length === 2 ? 'couple' : 'group',
      color: '#c98b86',
    });
  }
  for (const name of clean) {
    const id = uid();
    batch.set(doc(wsCol(ws, 'guests'), id), {
      id,
      name,
      side,
      rsvp: 'pending',
      kind: 'adult',
      dietary: '',
      plusOne: false,
      contact: '',
      notes: '',
      partyId,
    } satisfies Guest);
  }
  await batch.commit();
}

export async function addMember(ws: string, h: Household, name: string) {
  if (!name.trim()) return;
  const batch = writeBatch(db);
  let partyId = h.party?.id ?? null;
  if (!partyId) {
    // A single guest becomes a party when someone joins them.
    partyId = uid();
    batch.set(doc(wsCol(ws, 'parties'), partyId), { id: partyId, name: `${h.name} & ${name.trim()}`, type: 'couple', color: '#c98b86' });
    batch.update(doc(wsCol(ws, 'guests'), h.members[0].id), { partyId });
  }
  const id = uid();
  batch.set(doc(wsCol(ws, 'guests'), id), {
    id,
    name: name.trim(),
    side: h.members[0].side ?? 'both',
    rsvp: 'pending',
    kind: 'adult',
    dietary: '',
    plusOne: false,
    contact: '',
    notes: '',
    partyId,
  } satisfies Guest);
  await batch.commit();
}

export const renameGuest = (ws: string, id: string, name: string) => updateDoc(doc(wsCol(ws, 'guests'), id), { name: name.trim() });
export const updateGuest = (ws: string, id: string, patch: Partial<Guest>) => updateDoc(doc(wsCol(ws, 'guests'), id), patch);

export async function setHouseholdSide(ws: string, h: Household, side: string) {
  const batch = writeBatch(db);
  for (const g of [...h.members, ...h.plusOnes]) batch.update(doc(wsCol(ws, 'guests'), g.id), { side });
  await batch.commit();
}
export const removeGuest = (ws: string, id: string) => deleteDoc(doc(wsCol(ws, 'guests'), id));
export const renameHousehold = (ws: string, h: Household, name: string) =>
  h.party ? updateDoc(doc(wsCol(ws, 'parties'), h.party.id), { name: name.trim() }) : renameGuest(ws, h.members[0].id, name);

export async function deleteHousehold(ws: string, h: Household, invite?: Invite) {
  const batch = writeBatch(db);
  for (const g of [...h.members, ...h.plusOnes]) batch.delete(doc(wsCol(ws, 'guests'), g.id));
  if (h.party) batch.delete(doc(wsCol(ws, 'parties'), h.party.id));
  if (invite) batch.delete(doc(db, 'invites', invite.token));
  await batch.commit();
}

/* ---------- invite links ---------- */

export const markSent = (inv: Invite, sent = true) => updateDoc(doc(db, 'invites', inv.token), { sentAt: sent ? Date.now() : null });

/** Replace a link: the old URL stops working, answers carry over. */
export async function resetLink(ws: string, inv: Invite, guests: Guest[]) {
  const token = makeToken();
  const { token: _old, ...rest } = inv;
  void _old;
  const batch = writeBatch(db);
  batch.set(doc(db, 'invites', token), { ...rest, createdAt: Date.now(), sentAt: null, openedAt: null, openCount: 0 });
  batch.delete(doc(db, 'invites', inv.token));
  const plus = guests.find((g) => g.plusOneOf === inv.token);
  if (plus) batch.update(doc(wsCol(ws, 'guests'), plus.id), { plusOneOf: token });
  await batch.commit();
  return token;
}

/** Links always use the real domain, even when the admin is opened from *.web.app or localhost. */
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://kalahandromaric.com').replace(/\/$/, '');

export function inviteUrl(token: string) {
  return `${SITE_URL}/i/${token}`;
}
