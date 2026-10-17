import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  addHousehold,
  addMember,
  deleteHousehold,
  inviteUrl,
  markSent,
  removeGuest,
  renameGuest,
  renameHousehold,
  resetLink,
  setPlusOne,
  useAdmin,
} from '../../data/admin';
import { useContent } from '../../data/content';
import type { Invite } from '../../lib/model';
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
  const ws = a.workspaceId!;
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
      <div className="afield">
        Guests
        {[...h.members, ...h.plusOnes].map((m) => (
          <MemberRow key={m.id} id={m.id} name={m.name} tag={m.plusOneOf ? 'plus-one' : m.rsvp} canRemove={h.members.length > 1 || !!m.plusOneOf} ws={ws} />
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

function MemberRow({ id, name, tag, canRemove, ws }: { id: string; name: string; tag: string; canRemove: boolean; ws: string }) {
  const [v, setV] = useState(name);
  useEffect(() => setV(name), [name]);
  return (
    <div className="inline">
      <input className="ainput" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v.trim() && v !== name && renameGuest(ws, id, v)} aria-label="Guest name" />
      <span className="pill pill--soft">{tag}</span>
      {canRemove && (
        <button type="button" className="icon-btn" aria-label={`Remove ${name}`} onClick={() => confirm(`Remove ${name}?`) && removeGuest(ws, id)}>
          <CloseIcon size={14} />
        </button>
      )}
    </div>
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
