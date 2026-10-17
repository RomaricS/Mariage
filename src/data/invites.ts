import { doc, getDoc, increment, updateDoc, type UpdateData } from 'firebase/firestore';
import { db } from '../firebase';
import type { Invite, InviteResponse } from '../lib/model';

const TOKEN_KEY = 'kr.invite';

export function rememberToken(token: string) {
  if (token === DEMO_TOKEN) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function rememberedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** /i/demo previews the invite and RSVP flow without touching real data. */
export const DEMO_TOKEN = 'demo';
const demoInvite = (): Invite => ({
  token: DEMO_TOKEN,
  householdKey: 'demo',
  householdName: 'Camille & Hugo',
  guests: [
    { id: 'demo-a', name: 'Camille Martin' },
    { id: 'demo-b', name: 'Hugo Martin' },
  ],
  plusOneAllowed: true,
  createdAt: 0,
  response: null,
});

export async function fetchInvite(token: string): Promise<Invite | null> {
  if (token === DEMO_TOKEN) return demoInvite();
  if (!/^[A-Za-z0-9]{6,40}$/.test(token)) return null;
  const snap = await getDoc(doc(db, 'invites', token));
  return snap.exists() ? ({ ...(snap.data() as Invite), token }) : null;
}

/** Note that the guest opened their link (shown to the couple in /admin). */
export async function markOpened(invite: Invite) {
  if (invite.token === DEMO_TOKEN) return;
  const patch: UpdateData<Invite> = { openCount: increment(1) };
  if (!invite.openedAt) patch.openedAt = Date.now();
  try {
    await updateDoc(doc(db, 'invites', invite.token), patch);
  } catch {
    /* not critical */
  }
}

export async function submitResponse(token: string, response: InviteResponse) {
  if (token === DEMO_TOKEN) return;
  await updateDoc(doc(db, 'invites', token), { response });
}
