/** Shapes shared with the GuestList app (workspaces/{id}/guests, /parties). */
export type RsvpStatus = 'confirmed' | 'pending' | 'declined' | 'maybe';

export interface Guest {
  id: string;
  name: string;
  side?: string;
  rsvp: RsvpStatus;
  kind?: string;
  dietary?: string;
  plusOne?: boolean;
  contact?: string;
  notes?: string;
  partyId?: string | null;
  /** Set on guests this site created from a plus-one answer: the invite token. */
  plusOneOf?: string;
}

export interface Party {
  id: string;
  name: string;
  type?: string;
  color?: string;
}

/** invites/{token} — the only guest data the public site can reach. */
export interface InviteGuest {
  id: string;
  name: string;
  /** Shown as a "Child" tag on the RSVP page. */
  child?: boolean;
}

export type Answer = 'yes' | 'no';

export interface InviteResponse {
  attendees: Record<string, Answer>;
  plusOneName: string;
  dietary: Record<string, string>;
  song: string;
  note: string;
  lang: string;
  submittedAt: number;
}

export interface Invite {
  token: string;
  /** partyId from GuestList, or "g:<guestId>" for a guest without a party */
  householdKey: string;
  householdName: string;
  guests: InviteGuest[];
  plusOneAllowed: boolean;
  createdAt: number;
  sentAt?: number | null;
  openedAt?: number | null;
  openCount?: number;
  response?: InviteResponse | null;
  syncedAt?: number | null;
}

export const PLUS_ONE_ID = 'plusOne';
