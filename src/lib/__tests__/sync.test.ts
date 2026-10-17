import { describe, expect, it } from 'vitest';
import type { Guest, Invite, InviteResponse, Party } from '../model';
import { PLUS_ONE_ID } from '../model';
import { mergeContent } from '../merge';
import { buildHouseholds, computeStats, inviteIsStale, inviteShape, makeToken, needsResponseSync, responseToGuestWrites } from '../sync';

const g = (id: string, name: string, extra: Partial<Guest> = {}): Guest => ({ id, name, rsvp: 'pending', side: 'hers', plusOne: false, partyId: null, ...extra });

const parties: Party[] = [{ id: 'p1', name: 'Joe & Kathy' }];
const guests: Guest[] = [g('a', 'Joe', { partyId: 'p1', plusOne: true }), g('b', 'Kathy', { partyId: 'p1' }), g('c', 'Solo Sam')];

const response = (over: Partial<InviteResponse> = {}): InviteResponse => ({
  attendees: {},
  plusOneName: '',
  dietary: {},
  song: '',
  note: '',
  lang: 'en',
  submittedAt: 100,
  ...over,
});

const invite = (key: string, over: Partial<Invite> = {}): Invite => ({
  token: 'TOKEN12345',
  householdKey: key,
  householdName: '',
  guests: [],
  plusOneAllowed: false,
  createdAt: 1,
  ...over,
});

describe('makeToken', () => {
  it('is long, url-safe and varied', () => {
    const t = makeToken();
    expect(t).toMatch(/^[A-Za-z0-9]{10}$/);
    expect(new Set(Array.from({ length: 50 }, () => makeToken())).size).toBe(50);
  });
});

describe('buildHouseholds', () => {
  it('groups by party and gives party-less guests their own household', () => {
    const hs = buildHouseholds(guests, parties);
    expect(hs.map((h) => h.key)).toEqual(['p1', 'g:c']);
    expect(hs[0].members.map((m) => m.name)).toEqual(['Joe', 'Kathy']);
    expect(hs[0].plusOneAllowed).toBe(true);
    expect(hs[1].plusOneAllowed).toBe(false);
  });

  it('keeps RSVP-created plus-ones out of the invited members', () => {
    const hs = buildHouseholds([...guests, g('x', 'Ana', { partyId: 'p1', plusOneOf: 'TOKEN12345' })], parties);
    expect(hs[0].members).toHaveLength(2);
    expect(hs[0].plusOnes.map((p) => p.name)).toEqual(['Ana']);
  });

  it('skips empty parties', () => {
    expect(buildHouseholds([], parties)).toEqual([]);
  });
});

describe('invite staleness', () => {
  it('detects a plus-one change made in GuestList', () => {
    const [h] = buildHouseholds(guests, parties);
    const inv = invite('p1', inviteShape(h));
    expect(inviteIsStale(inv, h)).toBe(false);
    const [h2] = buildHouseholds([{ ...guests[0], plusOne: false }, guests[1]], parties);
    expect(inviteIsStale(inv, h2)).toBe(true);
  });
});

describe('invite guests', () => {
  it('marks children', () => {
    const [h] = buildHouseholds([...guests.slice(0, 2), g('k', 'Kid', { partyId: 'p1', kind: 'child' })], parties);
    expect(inviteShape(h).guests.map((x) => x.child)).toEqual([false, false, true]);
  });

  it('is not stale when the database returns fields in another order', () => {
    const [h] = buildHouseholds(guests, parties);
    const shape = inviteShape(h);
    const reordered = shape.guests.map((x) => ({ name: x.name, child: x.child, id: x.id }));
    expect(inviteIsStale(invite('p1', { ...shape, guests: reordered }), h)).toBe(false);
  });

  it('treats a missing child flag as not a child (older invites)', () => {
    const [h] = buildHouseholds(guests, parties);
    const shape = inviteShape(h);
    const old = shape.guests.map(({ id, name }) => ({ id, name }));
    expect(inviteIsStale(invite('p1', { ...shape, guests: old }), h)).toBe(false);
  });
});

describe('responseToGuestWrites', () => {
  const [h] = buildHouseholds(guests, parties);

  it('maps answers and dietary needs onto guests', () => {
    const r = response({ attendees: { a: 'yes', b: 'no' }, dietary: { a: 'Vegetarian' } });
    const w = responseToGuestWrites(invite('p1'), h, r, guests);
    expect(w).toEqual([
      { id: 'a', data: { rsvp: 'confirmed', dietary: 'Vegetarian' }, create: false },
      { id: 'b', data: { rsvp: 'declined' }, create: false },
    ]);
  });

  it('creates a guest for a named plus-one', () => {
    const r = response({ attendees: { a: 'yes', b: 'yes' }, plusOneName: 'Ana Rossi', dietary: { [PLUS_ONE_ID]: 'Vegan' } });
    const w = responseToGuestWrites(invite('p1'), h, r, guests);
    const created = w.find((x) => x.create)!;
    expect(created.data).toMatchObject({ name: 'Ana Rossi', rsvp: 'confirmed', dietary: 'Vegan', partyId: 'p1', plusOneOf: 'TOKEN12345' });
  });

  it('updates the existing plus-one instead of duplicating', () => {
    const existing = g('plus-TOKEN12345', 'Ana', { partyId: 'p1', plusOneOf: 'TOKEN12345', rsvp: 'confirmed' });
    const r = response({ attendees: { a: 'yes' }, plusOneName: 'Ana Rossi' });
    const w = responseToGuestWrites(invite('p1'), h, r, [...guests, existing]);
    expect(w.filter((x) => x.create)).toHaveLength(0);
    expect(w.find((x) => x.id === existing.id)!.data.name).toBe('Ana Rossi');
  });

  it('declines the plus-one when the household no longer comes', () => {
    const existing = g('plus-TOKEN12345', 'Ana', { partyId: 'p1', plusOneOf: 'TOKEN12345', rsvp: 'confirmed' });
    const r = response({ attendees: { a: 'no', b: 'no' }, plusOneName: 'Ana' });
    const w = responseToGuestWrites(invite('p1'), h, r, [...guests, existing]);
    expect(w.find((x) => x.id === existing.id)!.data).toEqual({ rsvp: 'declined' });
  });

  it('ignores a plus-one name when the invite does not allow one', () => {
    const [, solo] = buildHouseholds(guests, parties);
    const r = response({ attendees: { c: 'yes' }, plusOneName: 'Sneaky' });
    const w = responseToGuestWrites(invite('g:c'), solo, r, guests);
    expect(w.some((x) => x.create)).toBe(false);
  });

  it('writes nothing when nothing changed', () => {
    const synced = [{ ...guests[0], rsvp: 'confirmed' as const }, guests[1]];
    const [hs] = buildHouseholds(synced, parties);
    expect(responseToGuestWrites(invite('p1'), hs, response({ attendees: { a: 'yes' } }), synced)).toEqual([]);
  });
});

describe('needsResponseSync', () => {
  it('only when the answer is newer than the last sync', () => {
    expect(needsResponseSync(invite('p1'))).toBe(false);
    expect(needsResponseSync(invite('p1', { response: response({ submittedAt: 5 }) }))).toBe(true);
    expect(needsResponseSync(invite('p1', { response: response({ submittedAt: 5 }), syncedAt: 5 }))).toBe(false);
  });
});

describe('computeStats', () => {
  it('counts heads including plus-ones', () => {
    const list = [
      { ...guests[0], rsvp: 'confirmed' as const, dietary: 'vegetarian' },
      { ...guests[1], rsvp: 'declined' as const },
      guests[2],
      g('x', 'Ana', { partyId: 'p1', plusOneOf: 'T', rsvp: 'confirmed', dietary: 'Vegetarian' }),
    ];
    const hs = buildHouseholds(list, parties);
    const s = computeStats(list, hs, new Map());
    expect(s).toMatchObject({ invited: 3, attending: 2, declined: 1, awaiting: 1, plusOnes: 1, households: 2 });
    expect(s.diet).toEqual([{ label: 'Vegetarian', count: 2 }]);
  });
});

describe('mergeContent', () => {
  it('merges nested objects and replaces arrays', () => {
    const base = { a: { x: 1, y: 2 }, list: [1, 2, 3], s: 'hi' };
    expect(mergeContent(base, { a: { y: 5 }, list: [9] })).toEqual({ a: { x: 1, y: 5 }, list: [9], s: 'hi' });
  });
});
