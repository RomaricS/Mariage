import { Link } from 'react-router-dom';
import { useAdmin } from '../../data/admin';
import { useContent } from '../../data/content';
import { attendeesCsv, computeStats } from '../../lib/sync';

function download(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function ago(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Overview() {
  const a = useAdmin();
  const c = useContent();
  const s = computeStats(a.guests, a.households, a.invites);
  const daysLeft = Math.max(0, Math.ceil((new Date(c.date + 'T00:00:00').getTime() - Date.now()) / 86400000));

  const recent = [...a.invites.values()]
    .filter((i) => i.response)
    .sort((x, y) => (y.response!.submittedAt ?? 0) - (x.response!.submittedAt ?? 0))
    .slice(0, 6);
  const notOpened = a.households.filter((h) => {
    const inv = a.invites.get(h.key);
    return inv?.sentAt && !inv.openedAt;
  }).length;
  const notSent = a.households.length - s.linksSent;
  const unnamedPlus = [...a.invites.values()].filter((i) => i.plusOneAllowed && i.response && !i.response.plusOneName).length;
  const total = Math.max(1, s.attending + s.declined + s.awaiting);

  return (
    <div className="apage">
      <header className="apage__head">
        <div>
          <div className="akicker">
            {daysLeft} days to go · {new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="admin-h1">Overview</h1>
        </div>
        <div className="row-wrap">
          <button type="button" className="abtn abtn--outline" onClick={() => download('attendees.csv', attendeesCsv(a.guests, a.households))}>
            Export attendees (CSV)
          </button>
          <Link to="/admin/guests?f=awaiting" className="abtn abtn--navy">
            See who hasn’t replied
          </Link>
        </div>
      </header>

      <section className="tiles" aria-label="Key numbers">
        <div className="tile">
          <div className="tile__label">Invited</div>
          <div className="tile__value">{s.invited}</div>
          <div className="tile__sub">in {s.households} households</div>
        </div>
        <div className="tile">
          <div className="tile__label">Attending</div>
          <div className="tile__value">{s.attending}</div>
          <div className="tile__sub">incl. {s.plusOnes} plus-ones</div>
        </div>
        <div className="tile">
          <div className="tile__label">Households replied</div>
          <div className="tile__value">{s.householdsReplied}</div>
          <div className="tile__sub">
            of {s.households} · {s.households - s.householdsReplied} to go
          </div>
        </div>
        <div className="tile">
          <div className="tile__label">Links shared</div>
          <div className="tile__value">{s.linksSent}</div>
          <div className="tile__sub">{notSent} not sent yet</div>
        </div>
      </section>

      <section className="acard">
        <div className="acard__row">
          <h2 className="ah2">RSVP progress · {s.invited + s.plusOnes} people</h2>
          <span className="admin-muted">
            {c.rsvpDeadline ? `Deadline ${new Date(c.rsvpDeadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'No deadline set'}
          </span>
        </div>
        <div className="progress" role="img" aria-label={`${s.attending} attending, ${s.declined} declined, ${s.awaiting} awaiting reply`}>
          {s.attending > 0 && <span className="progress__yes" style={{ flex: s.attending }} title={`${s.attending} attending`} />}
          {s.declined > 0 && <span className="progress__no" style={{ flex: s.declined }} title={`${s.declined} declined`} />}
          {s.awaiting > 0 && <span className="progress__wait" style={{ flex: s.awaiting }} title={`${s.awaiting} awaiting`} />}
        </div>
        <div className="legend">
          <span>
            <i className="progress__yes" />
            Attending <b>{s.attending}</b> ({Math.round((s.attending / total) * 100)}%)
          </span>
          <span>
            <i className="progress__no" />
            Declined <b>{s.declined}</b>
          </span>
          <span>
            <i className="progress__wait" />
            Awaiting reply <b>{s.awaiting}</b>
          </span>
        </div>
      </section>

      <div className="acols">
        <section className="acard acard--wide">
          <h2 className="ah2">Latest responses</h2>
          {recent.length === 0 && <p className="admin-muted">No answers yet — they’ll appear here live.</p>}
          {recent.map((inv) => {
            const r = inv.response!;
            const yes = inv.guests.filter((g) => r.attendees[g.id] === 'yes').length + (r.plusOneName ? 1 : 0);
            const diets = Object.values(r.dietary).filter(Boolean);
            const detail = yes
              ? [`${yes} attending`, r.plusOneName && `plus-one: ${r.plusOneName}`, diets.length && diets.join(', '), r.song && `song: ${r.song}`]
                  .filter(Boolean)
                  .join(' · ')
              : r.note || 'Can’t make it';
            return (
              <div key={inv.token} className="resp">
                <span className="avatar">{inv.householdName.replace(/^The /, '')[0]}</span>
                <div className="resp__main">
                  <b>{inv.householdName}</b>
                  <span className="admin-muted">{detail}</span>
                  {r.note && yes > 0 && <span className="resp__note">“{r.note}”</span>}
                </div>
                <span className={`pill ${yes ? 'pill--yes' : 'pill--no'}`}>{yes ? 'Attending' : 'Declined'}</span>
                <span className="admin-muted resp__when">{ago(r.submittedAt)}</span>
              </div>
            );
          })}
        </section>
        <div className="acol">
          <section className="acard">
            <h2 className="ah2">For the caterer</h2>
            {s.diet.length === 0 && <p className="admin-muted">No dietary needs reported yet.</p>}
            {s.diet.map((d) => (
              <div key={d.label} className="acard__row">
                <span>{d.label}</span>
                <b>{d.count}</b>
              </div>
            ))}
          </section>
          <section className="acard acard--blush">
            <h2 className="ah2">Needs attention</h2>
            {notSent > 0 && <Link to="/admin/guests?f=notsent">{notSent} households haven’t been sent their link</Link>}
            {notOpened > 0 && <Link to="/admin/guests?f=awaiting">{notOpened} households never opened their link</Link>}
            {unnamedPlus > 0 && <Link to="/admin/guests">{unnamedPlus} invites with a plus-one slot left unnamed</Link>}
            {!c.rsvpDeadline && <Link to="/admin/content">Set an RSVP deadline</Link>}
            {!c.ceremonyTime && <Link to="/admin/content">Add the ceremony time</Link>}
            {!c.registry.externalUrl && !c.registry.funds.length && <Link to="/admin/content?s=registry">Registry is still empty</Link>}
          </section>
        </div>
      </div>
    </div>
  );
}
