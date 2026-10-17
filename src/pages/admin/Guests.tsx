import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  addHousehold,
  addMember,
  deleteHousehold,
  moveGuest,
  inviteUrl,
  markSent,
  removeGuest,
  renameHousehold,
  resetLink,
  setHouseholdSide,
  setPlusOne,
  updateGuest,
  useAdmin,
} from '../../data/admin';
import { useContent } from '../../data/content';
import type { Guest, Invite, RsvpStatus } from '../../lib/model';
import type { Household } from '../../lib/sync';
import { CloseIcon } from '../../components/Icons';

type Filter = 'all' | 'awaiting' | 'attending' | 'declined' | 'notsent';
const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['awaiting', 'Awaiting'],
  ['attending', 'Attending'],
  ['declined', 'Declined'],
  ['notsent', 'Not sent'],
];

function householdStatus(h: Household): 'attending' | 'declined' | 'partly' | 'awaiting' {
  const st = h.members.map((m) => m.rsvp);
  if (st.every((s) => s === 'confirmed')) return 'attending';
  if (st.every((s) => s === 'declined')) return 'declined';
  if (st.some((s) => s === 'confirmed')) return 'partly';
  return 'awaiting';
}

const statusLabel = { attending: 'Attending', declined: 'Declined', partly: 'Partly', awaiting: 'Awaiting' };

function shortDate(ts?: number | null) {
  return ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

export default function Guests() {
  const a = useAdmin();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('f') as Filter) || 'all';
  const [q, setQ] = useState('');
  const [sharing, setSharing] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const ws = a.workspaceId!;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return a.households.filter((h) => {
      const inv = a.invites.get(h.key);
      const st = householdStatus(h);
      if (filter === 'notsent' && inv?.sentAt) return false;
      if (filter === 'awaiting' && st !== 'awaiting') return false;
      if (filter === 'attending' && st !== 'attending' && st !== 'partly') return false;
      if (filter === 'declined' && st !== 'declined') return false;
      if (needle && !(h.name + ' ' + h.members.map((m) => m.name).join(' ')).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [a.households, a.invites, filter, q]);

  const shareH = a.households.find((h) => h.key === sharing);
  const editH = a.households.find((h) => h.key === editing);

  return (
    <div className="apage">
      <header className="apage__head">
        <div>
          <div className="alive">
            <span /> Live · same list as your GuestList app
          </div>
          <h1 className="admin-h1">Guests &amp; invites</h1>
        </div>
        <button type="button" className="abtn abtn--navy" onClick={() => setAdding(true)}>
          + Add household
        </button>
      </header>

      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Search guests</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input type="search" placeholder="Search a name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setParams(id === 'all' ? {} : { f: id })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-box">
        <table className="atable">
          <thead>
            <tr>
              <th>Household</th>
              <th>Guests</th>
              <th>Plus-one</th>
              <th>RSVP</th>
              <th>Invite link</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const inv = a.invites.get(h.key);
              const st = householdStatus(h);
              return (
                <tr key={h.key} className={sharing === h.key ? 'is-active' : ''}>
                  <td>
                    <button type="button" className="linklike" onClick={() => setEditing(h.key)}>
                      <b>{h.name}</b>
                    </button>
                    <div className="admin-muted small">
                      {h.members.map((m) => m.name).join(', ')}
                      {h.plusOnes.length > 0 && ` + ${h.plusOnes.map((p) => p.name).join(', ')}`}
                    </div>
                  </td>
                  <td>{h.members.length + h.plusOnes.filter((p) => p.rsvp === 'confirmed').length}</td>
                  <td>
                    <button
                      type="button"
                      className="aswitch"
                      role="switch"
                      aria-checked={h.plusOneAllowed}
                      aria-label={`Allow plus-one for ${h.name}`}
                      onClick={() => setPlusOne(ws, h, !h.plusOneAllowed)}
                    >
                      <span />
                    </button>
                  </td>
                  <td>
                    <span className={`pill pill--${st}`}>{statusLabel[st]}</span>
                  </td>
                  <td className="admin-muted small">
                    {!inv ? 'Creating…' : inv.sentAt ? `Sent ${shortDate(inv.sentAt)}` : 'Not sent yet'}
                    {inv?.openedAt ? ` · opened ${shortDate(inv.openedAt)}` : ''}
                  </td>
                  <td className="atable__end">
                    <button type="button" className="abtn abtn--outline abtn--sm" disabled={!inv} onClick={() => setSharing(h.key)}>
                      Share link
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-muted">
                  No households match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-muted small">
        Showing {rows.length} of {a.households.length} households. Plus-one changes apply to that household’s RSVP page right away.
      </div>

      {shareH && a.invites.get(shareH.key) && (
        <ShareDrawer h={shareH} inv={a.invites.get(shareH.key)!} onClose={() => setSharing(null)} />
      )}
      {editH && <EditHousehold h={editH} inv={a.invites.get(editH.key)} onClose={() => setEditing(null)} />}
      {adding && <AddHousehold onClose={() => setAdding(false)} />}
    </div>
  );
}

function Drawer({ title, kicker, sub, onClose, children }: { title: string; kicker: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="drawer-wrap">
      <button type="button" className="drawer-scrim" aria-label="Close" onClick={onClose} />
      <section className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <div>
            <div className="akicker">{kicker}</div>
            <h2 className="drawer__title">{title}</h2>
            {sub && <div className="admin-muted">{sub}</div>}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ShareDrawer({ h, inv, onClose }: { h: Household; inv: Invite; onClose: () => void }) {
  const c = useContent();
  const a = useAdmin();
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState('');
  const url = inviteUrl(inv.token);
  const first = h.name.replace(/^The /, '');
  const dateEn = new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dateFr = new Date(c.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const city = c.venue.city.replace(/\s*\d{5}.*$/, '');
  const deadlineEn = c.rsvpDeadline ? ` Please RSVP by ${new Date(c.rsvpDeadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : '';
  const deadlineFr = c.rsvpDeadline ? ` Merci de répondre avant le ${new Date(c.rsvpDeadline + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : '';
  const defaults = {
    en: `Hi ${first}! We’re getting married on ${dateEn} at ${c.venue.name} in ${city}, and we’d love you there. Here’s your personal invitation:${deadlineEn}\n${url}\n\nLove, ${c.couple.a} & ${c.couple.b}`,
    fr: `Bonjour ${first} ! Nous nous marions le ${dateFr} à ${c.venue.name} (${city}) et nous aimerions beaucoup vous y voir. Voici votre invitation personnelle :${deadlineFr}\n${url}\n\nAvec amour, ${c.couple.a} & ${c.couple.b}`,
  };
  const [message, setMessage] = useState(defaults.en);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: '#1C2B4B', light: '#FFF8F4' } }).then(setQr);
  }, [url]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const enc = encodeURIComponent(message);
  const subject = encodeURIComponent(`${c.couple.a} & ${c.couple.b} — ${lang === 'fr' ? 'votre invitation' : 'your invitation'}`);

  return (
    <Drawer title={h.name} kicker="Invite link" sub={h.members.map((m) => m.name).join(', ')} onClose={onClose}>
      <div className="linkbox">
        <code>{url}</code>
        <button type="button" className="abtn abtn--navy abtn--sm" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <div className="share-grid">
        <a href={`sms:?&body=${enc}`} onClick={() => markSent(inv)}>
          Text
        </a>
        <a href={`https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer" onClick={() => markSent(inv)}>
          WhatsApp
        </a>
        <a href={`mailto:?subject=${subject}&body=${enc}`} onClick={() => markSent(inv)}>
          Email
        </a>
        {qr && (
          <a href={qr} download={`invite-${first.replace(/\W+/g, '-').toLowerCase()}.png`}>
            QR code
          </a>
        )}
      </div>
      <div className="chips" role="group" aria-label="Message language">
        {(['en', 'fr'] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => {
              setLang(l);
              setMessage(defaults[l]);
            }}
          >
            {l === 'en' ? 'English' : 'Français'}
          </button>
        ))}
      </div>
      <label className="afield">
        Message (edit before sending)
        <textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {qr && <img className="qr" src={qr} alt={`QR code for ${h.name}'s invitation`} />}
      <div className="drawer__meta">
        <div>
          <b>Opened:</b> {inv.openedAt ? `${new Date(inv.openedAt).toLocaleString()} (${inv.openCount ?? 1}×)` : 'Not yet'}
        </div>
        <div>
          <b>Plus-one:</b> {h.plusOneAllowed ? 'Allowed — they can add a name when replying' : 'Not included'}
        </div>
        <div>
          <b>Answer:</b> {inv.response ? `received ${new Date(inv.response.submittedAt).toLocaleString()}` : 'none yet'}
        </div>
      </div>
      <div className="drawer__actions">
        <button
          type="button"
          className="abtn abtn--danger-text"
          onClick={async () => {
            if (confirm('Make a new link? The old one will stop working immediately.')) await resetLink(a.workspaceId!, inv, a.guests);
          }}
        >
          Reset link
        </button>
        <button
          type="button"
          className="abtn abtn--navy"
          onClick={() => {
            markSent(inv, !inv.sentAt);
            if (!inv.sentAt) onClose();
          }}
        >
          {inv.sentAt ? 'Mark as not sent' : 'Mark as sent'}
        </button>
      </div>
    </Drawer>
  );
}

function EditHousehold({ h, inv, onClose }: { h: Household; inv?: Invite; onClose: () => void }) {
  const a = useAdmin();
  const c = useContent();
  const ws = a.workspaceId!;
  const side = h.members[0]?.side ?? 'both';
  const [name, setName] = useState(h.name);
  const [newMember, setNewMember] = useState('');
  return (
    <Drawer title={h.name} kicker="Edit household" onClose={onClose}>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && name !== h.name) renameHousehold(ws, h, name);
        }}
      >
        <label className="afield">
          Household name (shown on the invitation)
          <div className="inline">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button className="abtn abtn--outline abtn--sm">Save</button>
          </div>
        </label>
      </form>
      <label className="afield">
        Side
        <select value={side} onChange={(e) => setHouseholdSide(ws, h, e.target.value)}>
          <option value="yours">{c.couple.b}’s side</option>
          <option value="hers">{c.couple.a}’s side</option>
          <option value="both">Shared</option>
        </select>
      </label>
      {inv?.response && (
        <p className="admin-muted small">
          They answered online on {new Date(inv.response.submittedAt).toLocaleDateString()}. Changes you make here stay until they send a new answer from their
          link.
        </p>
      )}
      <div className="afield">
        Guests
        {[...h.members, ...h.plusOnes].map((m) => (
          <MemberCard key={m.id} g={m} home={h} canRemove={h.members.length > 1 || !!m.plusOneOf} ws={ws} />
        ))}
      </div>
      <form
        className="inline"
        onSubmit={async (e) => {
          e.preventDefault();
          await addMember(ws, h, newMember);
          setNewMember('');
        }}
      >
        <input className="ainput" placeholder="Add a person…" value={newMember} onChange={(e) => setNewMember(e.target.value)} aria-label="New guest name" />
        <button className="abtn abtn--outline abtn--sm">Add</button>
      </form>
      <div className="drawer__actions">
        <button
          type="button"
          className="abtn abtn--danger-text"
          onClick={async () => {
            if (confirm(`Remove ${h.name} and their invite link from the guest list?`)) {
              await deleteHousehold(ws, h, inv);
              onClose();
            }
          }}
        >
          Delete household
        </button>
        <button type="button" className="abtn abtn--navy" onClick={onClose}>
          Done
        </button>
      </div>
    </Drawer>
  );
}

const RSVP_OPTIONS: [RsvpStatus, string][] = [
  ['pending', 'Awaiting'],
  ['confirmed', 'Attending'],
  ['declined', 'Declined'],
  ['maybe', 'Maybe'],
];

/** One person: every GuestList field, saved as soon as it changes (text fields on blur). */
function MemberCard({ g, home, canRemove, ws }: { g: Guest; home: Household; canRemove: boolean; ws: string }) {
  const { households } = useAdmin();
  const [draft, setDraft] = useState({ name: g.name, dietary: g.dietary ?? '', contact: g.contact ?? '', notes: g.notes ?? '' });
  useEffect(() => {
    setDraft({ name: g.name, dietary: g.dietary ?? '', contact: g.contact ?? '', notes: g.notes ?? '' });
  }, [g.name, g.dietary, g.contact, g.notes]);
  const save = (k: keyof typeof draft) => {
    const v = draft[k].trim();
    if (k === 'name' && !v) return setDraft({ ...draft, name: g.name });
    if (v !== ((g[k] as string | undefined) ?? '')) updateGuest(ws, g.id, { [k]: v });
  };
  const text = (k: keyof typeof draft, label: string, placeholder = '') => (
    <label className="afield">
      {label}
      <input value={draft[k]} placeholder={placeholder} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} onBlur={() => save(k)} />
    </label>
  );
  return (
    <fieldset className="member">
      <legend className="sr-only">{g.name}</legend>
      <div className="member__head">
        <input
          className="ainput member__name"
          value={draft.name}
          aria-label="Name"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onBlur={() => save('name')}
        />
        {g.plusOneOf && <span className="pill pill--soft">plus-one</span>}
        {canRemove && (
          <button type="button" className="icon-btn" aria-label={`Remove ${g.name}`} onClick={() => confirm(`Remove ${g.name}?`) && removeGuest(ws, g.id)}>
            <CloseIcon size={14} />
          </button>
        )}
      </div>
      <div className="member__grid">
        <label className="afield">
          RSVP
          <select value={g.rsvp} onChange={(e) => updateGuest(ws, g.id, { rsvp: e.target.value as RsvpStatus })}>
            {RSVP_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="afield">
          Age
          <select value={g.kind ?? 'adult'} onChange={(e) => updateGuest(ws, g.id, { kind: e.target.value })}>
            <option value="adult">Adult</option>
            <option value="child">Child</option>
          </select>
        </label>
        {text('dietary', 'Dietary', 'Vegetarian, allergies…')}
        {text('contact', 'Contact', 'Phone or email')}
      </div>
      {!g.plusOneOf && (
        <label className="afield">
          Household (shares one invite link)
          <select
            value={home.key}
            onChange={(e) => {
              const v = e.target.value;
              if (v === home.key) return;
              const target = v === '__own' ? null : households.find((x) => x.key === v) ?? null;
              const label = target ? target.name : 'their own household';
              if (confirm(`Move ${g.name} to ${label}? They’ll answer through that household’s link.`)) moveGuest(ws, g, target);
            }}
          >
            <option value={home.key}>{home.name} (current)</option>
            {home.members.length > 1 && <option value="__own">Their own household</option>}
            {households
              .filter((x) => x.key !== home.key)
              .map((x) => (
                <option key={x.key} value={x.key}>
                  {x.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {text('notes', 'Notes')}
    </fieldset>
  );
}

function AddHousehold({ onClose }: { onClose: () => void }) {
  const a = useAdmin();
  const c = useContent();
  const [names, setNames] = useState('');
  const [side, setSide] = useState('both');
  const [busy, setBusy] = useState(false);
  return (
    <Drawer title="New household" kicker="Guest list" onClose={onClose}>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await addHousehold(a.workspaceId!, names.split('\n'), side);
          setBusy(false);
          onClose();
        }}
      >
        <label className="afield">
          Names — one person per line
          <textarea rows={5} value={names} onChange={(e) => setNames(e.target.value)} required placeholder={'Camille Martin\nHugo Martin'} />
        </label>
        <label className="afield">
          Side
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="yours">{c.couple.b}’s side</option>
            <option value="hers">{c.couple.a}’s side</option>
            <option value="both">Shared</option>
          </select>
        </label>
        <p className="admin-muted small">An invite link is created automatically.</p>
        <button className="abtn abtn--navy" disabled={busy}>
          Add household
        </button>
      </form>
    </Drawer>
  );
}
