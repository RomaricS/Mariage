import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useContent } from '../data/content';
import { fetchInvite, markOpened, rememberToken } from '../data/invites';
import { useI18n } from '../i18n';
import type { Invite } from '../lib/model';
import { LangToggle, Monogram, Names } from '../components/ui';
import { Sparkle } from '../components/Icons';

export function useInvite(token: string | undefined) {
  const [state, setState] = useState<{ status: 'loading' | 'missing' | 'ok'; invite: Invite | null }>({ status: 'loading', invite: null });
  useEffect(() => {
    if (!token) return setState({ status: 'missing', invite: null });
    let live = true;
    fetchInvite(token)
      .then((inv) => {
        if (!live) return;
        if (inv) rememberToken(inv.token);
        setState({ status: inv ? 'ok' : 'missing', invite: inv });
      })
      .catch(() => live && setState({ status: 'missing', invite: null }));
    return () => {
      live = false;
    };
  }, [token]);
  return state;
}

export function InviteMissing() {
  const { t } = useI18n();
  const c = useContent();
  return (
    <div className="screen screen--navy screen--center">
      <Sparkle size={28} className="pink" />
      <h1 className="h2">{t('inviteNotFound')}</h1>
      <p className="screen__text">{t('inviteNotFoundText')}</p>
      {c.contactEmail && (
        <a className="link-light" href={`mailto:${c.contactEmail}`}>
          {c.contactEmail}
        </a>
      )}
      <Link to="/" className="btn btn--pink">
        {t('backHome')}
      </Link>
    </div>
  );
}

export function Loading() {
  const { t } = useI18n();
  return (
    <div className="screen screen--navy screen--center" aria-busy="true">
      <Sparkle size={28} className="pink spin" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}

export default function InvitePage() {
  const { token } = useParams();
  const { status, invite } = useInvite(token);
  const c = useContent();
  const { t, fmtDate } = useI18n();
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState(!!reduce);

  useEffect(() => {
    if (invite) markOpened(invite);
  }, [invite]);

  if (status === 'loading') return <Loading />;
  if (!invite) return <InviteMissing />;

  return (
    <div className="screen screen--navy invite">
      <div className="invite__top">
        <LangToggle />
      </div>
      <Sparkle size={22} className="pink invite__spark1 drift" />
      <Sparkle size={14} className="invite__spark2 drift-slow" />
      <div className="kicker kicker--pink">{t('aNoteFor')}</div>
      <div className="invite__to">{invite.householdName}</div>

      <div className="envelope">
        <div className="envelope__back" />
        <motion.div
          className="envelope__card"
          initial={false}
          animate={{ y: opened ? -176 : 0 }}
          transition={{ duration: 0.9, delay: opened ? 0.35 : 0, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="eyebrow">{t('invitedTo')}</div>
          <div className="envelope__names">
            <Names a={c.couple.a} b={c.couple.b} br />
          </div>
          <div className="envelope__rule" />
          <div className="envelope__date">{fmtDate(c.date)}</div>
          <div className="envelope__venue">
            {c.venue.name} · {c.venue.city.replace(/\s*\d{5}.*$/, '')}
          </div>
          {c.rsvpDeadline && (
            <div className="envelope__venue">
              {t('kindlyReply')} {fmtDate(c.rsvpDeadline, { month: 'long', day: 'numeric' })}
            </div>
          )}
        </motion.div>
        <div className="envelope__pocket" />
        <motion.div
          className="envelope__flap"
          initial={false}
          animate={{ rotateX: opened ? 180 : 0, zIndex: opened ? 0 : 3 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        <AnimatePresence>
          {!opened && (
            <motion.button
              type="button"
              className="envelope__seal"
              aria-label={t('tapToOpen')}
              onClick={() => setOpened(true)}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.06, 1], opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 2.2 }, opacity: { duration: 0.3 } }}
            >
              <Monogram a={c.couple.a} b={c.couple.b} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {opened ? (
          <motion.div key="cta" className="invite__cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Link to={`/i/${invite.token}/rsvp`} className="btn btn--pink btn--block">
              {invite.response ? t('changeAnswer') : t('rsvpForParty')}
            </Link>
            <Link to="/" className="btn btn--ghost-light btn--block">
              {t('explore')}
            </Link>
          </motion.div>
        ) : (
          <motion.p key="hint" className="invite__hint" exit={{ opacity: 0 }}>
            {t('tapToOpen')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
