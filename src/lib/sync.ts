import { PLUS_ONE_ID, type Guest, type Invite, type InviteResponse, type Party } from './model';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Unguessable invite token (10 chars from a 56-char alphabet ≈ 58 bits). */
export function makeToken(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join('');
}

export interface Household {
  key: string;
  name: string;
  party: Party | null;
  /** Invited people, excluding plus-ones this site added. */
  members: Guest[];
  /** Plus-one guests created from RSVP answers (for party households). */
  plusOnes: Guest[];
  plusOneAllowed: boolean;
}

/** Group GuestList guests into households: one per party, one per party-less guest. */
export function buildHouseholds(guests: Guest[], parties: Party[]): Household[] {
  const byParty = new Map<string, Guest[]>();
  const solo: Guest[] = [];
  for (const g of guests) {
    if (g.partyId) {
      const list = byParty.get(g.partyId) ?? [];
      list.push(g);
      byParty.set(g.partyId, list);
    } else if (!g.plusOneOf) {
      solo.push(g);
    }
  }
  const households: Household[] = [];
  for (const p of parties) {
    const all = byParty.get(p.id) ?? [];
    const members = all.filter((g) => !g.plusOneOf);
    if (!members.length) continue;
    households.push({
      key: p.id,
      name: p.name || members.map((m) => m.name).join(' & '),
      party: p,
      members,
      plusOnes: all.filter((g) => g.plusOneOf),
      plusOneAllowed: members.some((m) => m.plusOne),
    });
  }
  for (const g of solo) {
    households.push({
      key: 'g:' + g.id,
      name: g.name,
      party: null,
      members: [g],
      plusOnes: [],
      plusOneAllowed: !!g.plusOne,
    });
  }
  return households.sort((a, b) => a.name.localeCompare(b.name));
}

/** The invite fields derived from a household; compare with an invite to see if it is stale. */
export function inviteShape(h: Household): Pick<Invite, 'householdKey' | 'householdName' | 'guests' | 'plusOneAllowed'> {
  return {
    householdKey: h.key,
    householdName: h.name,
    guests: h.members.map((m) => ({ id: m.id, name: m.name })),
    plusOneAllowed: h.plusOneAllowed,
  };
}

export function inviteIsStale(invite: Invite, h: Household): boolean {
  const s = inviteShape(h);
  return (
    invite.householdName !== s.householdName ||
    invite.plusOneAllowed !== s.plusOneAllowed ||
    !sameGuests(invite.guests ?? [], s.guests)
  );
}

/** Field by field: Firestore doesn't promise to keep object key order, so no JSON.stringify. */
function sameGuests(a: Invite['guests'], b: Invite['guests']) {
  return a.length === b.length && a.every((g, i) => g.id === b[i].id && g.name === b[i].name);
}

export interface GuestWrite {
  id: string;
  /** Full doc for a new guest, or a partial patch for an existing one. */
  data: Partial<Guest>;
  create: boolean;
}

/**
 * Turn an RSVP answer into GuestList guest updates: rsvp status and dietary per
 * member, plus creating/updating a guest record for a named plus-one.
 */
export function responseToGuestWrites(
  invite: Invite,
  h: Household,
  response: InviteResponse,
  allGuests: Guest[],
): GuestWrite[] {
  const writes: GuestWrite[] = [];
  for (const m of h.members) {
    const answer = response.attendees[m.id];
    if (!answer) continue;
    const patch: Partial<Guest> = { rsvp: answer === 'yes' ? 'confirmed' : 'declined' };
    const diet = response.dietary[m.id]?.trim();
    if (diet) patch.dietary = diet;
    if (patch.rsvp !== m.rsvp || (diet && diet !== m.dietary)) writes.push({ id: m.id, data: patch, create: false });
  }

  const anyYes = h.members.some((m) => response.attendees[m.id] === 'yes');
  const plusName = response.plusOneName.trim();
  const existing = allGuests.find((g) => g.plusOneOf === invite.token);
  if (h.plusOneAllowed && plusName && anyYes) {
    const diet = response.dietary[PLUS_ONE_ID]?.trim() ?? '';
    if (existing) {
      writes.push({ id: existing.id, data: { name: plusName, rsvp: 'confirmed', dietary: diet, plusOneOf: invite.token }, create: false });
    } else {
      const host = h.members[0];
      writes.push({
        id: 'plus-' + invite.token,
        create: true,
        data: {
          id: 'plus-' + invite.token,
          name: plusName,
          side: host.side ?? 'both',
          rsvp: 'confirmed',
          kind: 'adult',
          dietary: diet,
          plusOne: false,
          contact: '',
          notes: `Plus-one of ${host.name} (added from RSVP)`,
          partyId: h.party ? h.party.id : null,
          plusOneOf: invite.token,
        },
      });
    }
  } else if (existing && existing.rsvp !== 'declined') {
    writes.push({ id: existing.id, data: { rsvp: 'declined' }, create: false });
  }
  return writes;
}

export function needsResponseSync(invite: Invite): boolean {
  return !!invite.response && (invite.syncedAt ?? 0) < invite.response.submittedAt;
}

export interface Stats {
  invited: number;
  households: number;
  attending: number;
  declined: number;
  awaiting: number;
  plusOnes: number;
  householdsReplied: number;
  linksSent: number;
  diet: { label: string; count: number }[];
}

export function computeStats(guests: Guest[], households: Household[], invites: Map<string, Invite>): Stats {
  const invitedGuests = guests.filter((g) => !g.plusOneOf);
  const plusOnes = guests.filter((g) => g.plusOneOf && g.rsvp === 'confirmed').length;
  const diet = new Map<string, number>();
  for (const g of guests) {
    if (g.rsvp !== 'confirmed' || !g.dietary?.trim()) continue;
    const key = g.dietary.trim().toLowerCase();
    diet.set(key, (diet.get(key) ?? 0) + 1);
  }
  let replied = 0;
  let sent = 0;
  for (const h of households) {
    const inv = invites.get(h.key);
    if (inv?.response) replied++;
    if (inv?.sentAt) sent++;
  }
  return {
    invited: invitedGuests.length,
    households: households.length,
    attending: invitedGuests.filter((g) => g.rsvp === 'confirmed').length + plusOnes,
    declined: invitedGuests.filter((g) => g.rsvp === 'declined').length,
    awaiting: invitedGuests.filter((g) => g.rsvp === 'pending' || g.rsvp === 'maybe').length,
    plusOnes,
    householdsReplied: replied,
    linksSent: sent,
    diet: [...diet.entries()]
      .map(([label, count]) => ({ label: label[0].toUpperCase() + label.slice(1), count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** CSV of everyone attending, for the caterer. */
export function attendeesCsv(guests: Guest[], households: Household[]): string {
  const nameOf = new Map<string, string>();
  for (const h of households) for (const g of [...h.members, ...h.plusOnes]) nameOf.set(g.id, h.name);
  const rows = [['Name', 'Household', 'Dietary', 'Kind']];
  for (const g of guests) {
    if (g.rsvp !== 'confirmed') continue;
    rows.push([g.name, nameOf.get(g.id) ?? '', g.dietary ?? '', g.kind ?? 'adult']);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
