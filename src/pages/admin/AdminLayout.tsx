import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { redirectResult, saveWorkspaceId, signIn, signInHelp, signOutAdmin, useAdmin } from '../../data/admin';
import { useContent } from '../../data/content';
import { Monogram } from '../../components/ui';
import { GiftIcon, Sparkle } from '../../components/Icons';
import '../../styles/admin.css';

const icons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  guests: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
    </svg>
  ),
  content: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  ),
};

function Gate({ children }: { children: ReactNode }) {
  return (
    <div className="admin-gate">
      <div className="admin-gate__card">{children}</div>
    </div>
  );
}

function SignIn() {
  const c = useContent();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    redirectResult().catch((e) => setError(signInHelp(e)));
  }, []);
  return (
    <Gate>
      <div className="admin-gate__mono">
        <Monogram a={c.couple.a} b={c.couple.b} />
      </div>
      <h1 className="admin-h1">Wedding admin</h1>
      <p className="admin-muted">
        For {c.couple.a} &amp; {c.couple.b} only.
      </p>
      <button
        type="button"
        className="abtn abtn--navy"
        disabled={busy}
        onClick={async () => {
          setError('');
          setBusy(true);
          try {
            await signIn();
          } catch (e) {
            setError(signInHelp(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Opening Google…' : 'Sign in with Google'}
      </button>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
    </Gate>
  );
}

function Setup() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Gate>
      <h1 className="admin-h1">Connect your guest list</h1>
      <p className="admin-muted">
        Paste the workspace id from your GuestList link — the part after <code>#w=</code>. It is saved privately; only admins can read it.
      </p>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await saveWorkspaceId(id);
          setBusy(false);
        }}
      >
        <label className="afield">
          Workspace id
          <input value={id} onChange={(e) => setId(e.target.value)} required pattern="[A-Za-z0-9_-]{6,}" />
        </label>
        <button className="abtn abtn--navy" disabled={busy}>
          Connect
        </button>
      </form>
    </Gate>
  );
}

export default function AdminLayout() {
  const a = useAdmin();
  const c = useContent();

  if (a.auth === 'loading') {
    return (
      <Gate>
        <Sparkle className="spin admin-rose" size={28} />
      </Gate>
    );
  }
  if (a.auth === 'signedOut') return <SignIn />;
  if (a.auth === 'rulesBlocked') {
    return (
      <Gate>
        <h1 className="admin-h1">Almost there</h1>
        <p className="admin-muted">
          You’re signed in as <b>{a.user?.email}</b>, but the database rules from this project aren’t deployed yet, so the admin list can’t be read.
          From the project folder run:
        </p>
        <code className="admin-code">firebase deploy --only firestore:rules</code>
        <p className="admin-muted small">Then reload this page.</p>
        <button type="button" className="abtn abtn--outline" onClick={() => signOutAdmin()}>
          Sign out
        </button>
      </Gate>
    );
  }
  if (a.auth === 'notAllowed') {
    return (
      <Gate>
        <h1 className="admin-h1">Not on the list</h1>
        <p className="admin-muted">You’re signed in as</p>
        <code className="admin-code">{a.user?.email}</code>
        <p className="admin-muted">
          In Firestore, the <code>admins</code> collection needs a document whose <b>Document ID</b> is exactly that address — all lowercase, no
          spaces. (Leave “Auto-ID” off; the fields don’t matter.) Then reload.
        </p>
        <div className="row-wrap">
          <button type="button" className="abtn abtn--navy" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button type="button" className="abtn abtn--outline" onClick={() => signOutAdmin()}>
            Use another account
          </button>
        </div>
      </Gate>
    );
  }
  if (!a.workspaceId) return <Setup />;

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <Monogram a={c.couple.a} b={c.couple.b} /> <span>ADMIN</span>
        </div>
        <nav className="admin__nav">
          <NavLink to="/admin" end>
            {icons.overview}Overview
          </NavLink>
          <NavLink to="/admin/guests">{icons.guests}Guests &amp; invites</NavLink>
          <NavLink to="/admin/content">{icons.content}Site content</NavLink>
          <Link to="/admin/content?s=registry">
            <GiftIcon size={18} />
            Registry
          </Link>
        </nav>
        <div className="admin__foot">
          <Link to="/" target="_blank">
            View live site ↗
          </Link>
          <span>{a.user?.displayName ?? a.user?.email}</span>
          <button type="button" className="admin__signout" onClick={() => signOutAdmin()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin__main">
        {a.error && (
          <div className="admin-alert" role="alert">
            {a.error}
          </div>
        )}
        {!a.loaded ? (
          <div className="admin-loading">
            <Sparkle className="spin admin-rose" size={24} /> Loading your guest list…
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
