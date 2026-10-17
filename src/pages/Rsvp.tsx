import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { rsvpIsClosed, useContent } from '../data/content';
import { submitResponse } from '../data/invites';
import { useI18n } from '../i18n';
import { PLUS_ONE_ID, type Answer, type Invite, type InviteResponse } from '../lib/model';
import { downloadIcs } from '../lib/calendar';
import { CalendarIcon, ChevronLeft, HeartIcon, Sparkle } from '../components/Icons';
import { LangToggle, Monogram } from '../components/ui';
import { InviteMissing, Loading, useInvite } from './Invite';

type Step = 1 | 2 | 3;

export default function RsvpPage() {
  const { token } = useParams();
  const { status, invite } = useInvite(token);
  if (status === 'loading') return <Loading />;
  if (!invite) return <InviteMissing />;
  return <RsvpFlow invite={invite} />;
}

function RsvpFlow({ invite }: { invite: Invite }) {
  const c = useContent();
  const { t, lang, fmtDate } = useI18n();
  const reduce = useReducedMotion();
  const prev = invite.response;
  const [step, setStep] = useState<Step>(prev ? 3 : 1);
  const [attendees, setAttendees] = useState<Record<string, Answer>>(prev?.attendees ?? {});
  const [plus, setPlus] = useState(!!prev?.plusOneName);
  const [plusName, setPlusName] = useState(prev?.plusOneName ?? '');
  const [dietary, setDietary] = useState<Record<string, string>>(prev?.dietary ?? {});
  const [song, setSong] = useState(prev?.song ?? '');
  const [note, setNote] = useState(prev?.note ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  // Braces matter: an effect may only return a cleanup function. Returning scrollTo's
  // result crashed React in browsers where it isn't undefined.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const closed = rsvpIsClosed(c);
  const allAnswered = invite.guests.every((g) => attendees[g.id]);
  const anyYes = invite.guests.some((g) => attendees[g.id] === 'yes');
  const withPlus = invite.plusOneAllowed && plus && anyYes;
  const attending = useMemo(() => {
    const list = invite.guests.filter((g) => attendees[g.id] === 'yes');
    if (withPlus) list.push({ id: PLUS_ONE_ID, name: plusName.trim() || t('yourGuest') });
    return list;
  }, [invite.guests, attendees, withPlus, plusName, t]);

  const send = async () => {
    setSending(true);
    setError(false);
    const response: InviteResponse = {
      attendees,
      plusOneName: withPlus ? plusName.trim() : '',
      dietary: Object.fromEntries(attending.map((a) => [a.id, (dietary[a.id] ?? '').trim()])),
      song: anyYes ? song.trim() : '',
      note: note.trim(),
      lang,
      submittedAt: Date.now(),
    };
    try {
      await submitResponse(invite.token, response);
      setStep(3);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const next = () => {
    if (step === 1) {
      if (!allAnswered) return;
      if (anyYes) setStep(2);
      else send();
    } else if (step === 2) send();
  };

  const heading = step === 1 ? t('willYouJoin') : step === 2 ? t('details') : t('thankYou');
  const stepLabel = step === 3 ? t('allDone') : `${t('step')} ${step} ${t('of')} 2`;
  const deadline = c.rsvpDeadline ? ` ${t('until')} ${fmtDate(c.rsvpDeadline, { month: 'long', day: 'numeric' })}` : '';
  const slide = reduce
    ? {}
    : { initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -28 }, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } };

  if (closed && step !== 3) {
    return (
      <div className="screen screen--navy screen--center">
        <Sparkle size={28} className="pink" />
        <h1 className="h2">{t('closed')}</h1>
        <p className="screen__text">{t('closedText')}</p>
        <Link to="/" className="btn btn--pink">
          {t('viewSite')}
        </Link>
      </div>
    );
  }

  return (
    <div className="rsvp">
      <header className="rsvp__head">
        <div className="rsvp__bar">
          {step === 2 ? (
            <button type="button" className="icon-btn icon-btn--light" aria-label={t('back')} onClick={() => setStep(1)}>
              <ChevronLeft size={18} />
            </button>
          ) : (
            <Link to="/" className="rsvp__brand" aria-label={t('viewSite')}>
              <Monogram a={c.couple.a} b={c.couple.b} />
            </Link>
          )}
          <div className="rsvp__dots" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className={n === step ? 'is-current' : n < step ? 'is-done' : ''} />
            ))}
          </div>
          <LangToggle />
        </div>
        <div className="kicker kicker--pink">{stepLabel}</div>
        <h1 className="rsvp__title">{heading}</h1>
      </header>

      <main className="rsvp__body">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" className="rsvp__step" {...slide}>
              <p className="body">{t('eachPerson')}</p>
              {invite.guests.map((g) => (
                <div key={g.id} className="guest-card">
                  <div className="guest-card__who">
                    <span className="avatar">{g.name[0]}</span>
                    <span>{g.name}</span>
                    {g.child && <span className="child-tag">{t('child')}</span>}
                  </div>
                  <div className="choice" role="group" aria-label={g.name}>
                    <button
                      type="button"
                      className="choice__btn choice__btn--yes"
                      aria-pressed={attendees[g.id] === 'yes'}
                      onClick={() => setAttendees({ ...attendees, [g.id]: 'yes' })}
                    >
                      {t('accepts')}
                      {attendees[g.id] === 'yes' && !reduce && <Confetti />}
                    </button>
                    <button
                      type="button"
                      className="choice__btn choice__btn--no"
                      aria-pressed={attendees[g.id] === 'no'}
                      onClick={() => setAttendees({ ...attendees, [g.id]: 'no' })}
                    >
                      {t('declines')}
                    </button>
                  </div>
                </div>
              ))}
              {invite.plusOneAllowed && anyYes && (
                <div className="plus-card">
                  <div className="plus-card__row">
                    <div>
                      <div className="plus-card__title">{t('bringingGuest')}</div>
                      <div className="plus-card__sub">{t('plusIncluded')}</div>
                    </div>
                    <button type="button" className="switch" role="switch" aria-checked={plus} aria-label={t('bringPlus')} onClick={() => setPlus(!plus)}>
                      <span />
                    </button>
                  </div>
                  {plus && (
                    <label className="field">
                      {t('theirName')}
                      <input type="text" value={plusName} onChange={(e) => setPlusName(e.target.value)} autoComplete="off" />
                    </label>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" className="rsvp__step" {...slide}>
              {attending.map((a) => (
                <label key={a.id} className="field">
                  {t('dietaryFor')} · {a.name}
                  <input
                    type="text"
                    placeholder={t('dietaryPh')}
                    value={dietary[a.id] ?? ''}
                    onChange={(e) => setDietary({ ...dietary, [a.id]: e.target.value })}
                  />
                </label>
              ))}
              <label className="field">
                {t('song')}
                <input type="text" placeholder={t('songPh')} value={song} onChange={(e) => setSong(e.target.value)} />
              </label>
              <label className="field">
                {t('noteFor')}
                <textarea rows={4} placeholder={t('optional')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} />
              </label>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" className="rsvp__step rsvp__done" {...slide}>
              <div className="done-badge">
                {anyYes && !reduce && <Confetti big />}
                <HeartIcon size={52} />
              </div>
              <h2 className="h3">{anyYes ? t('seeYou') : t('missYou')}</h2>
              <p className="body">{(anyYes ? t('savedYes') : t('savedNo')) + deadline + '.'}</p>
              <div className="summary">
                {invite.guests.map((g) => (
                  <div key={g.id} className="summary__row">
                    <span>{g.name}</span>
                    <b>{attendees[g.id] === 'yes' ? t('attending') : t('notAttending')}</b>
                  </div>
                ))}
                {withPlus && (
                  <div className="summary__row">
                    <span>
                      {t('plusOne')}
                      {plusName ? ` · ${plusName}` : ''}
                    </span>
                    <b>{t('attending')}</b>
                  </div>
                )}
              </div>
              {anyYes && (
                <button type="button" className="btn btn--outline" onClick={() => downloadIcs(c)}>
                  <CalendarIcon size={18} /> {t('addCalendar')}
                </button>
              )}
              {!closed && (
                <button type="button" className="text-btn" onClick={() => setStep(1)}>
                  {t('changeAnswer')}
                </button>
              )}
              <Link to="/" className="text-btn">
                {t('viewSite')}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {step !== 3 && (
        <footer className="rsvp__foot">
          {error && (
            <p className="rsvp__error" role="alert">
              {t('sendError')}
            </p>
          )}
          <button type="button" className="btn btn--navy btn--block btn--lg" disabled={(step === 1 && !allAnswered) || sending} onClick={next}>
            {sending ? t('sending') : step === 1 ? (anyYes || !allAnswered ? t('continue') : t('sendAnswer')) : t('sendRsvp')}
          </button>
        </footer>
      )}
    </div>
  );
}

const confettiColors = ['#F2C4CC', '#1C2B4B', '#E3A9B5', '#9FB4D6'];

function Confetti({ big = false }: { big?: boolean }) {
  const n = big ? 18 : 10;
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2;
        const dist = (big ? 90 : 46) + (i % 3) * 12;
        return (
          <motion.i
            key={i}
            style={{ background: confettiColors[i % confettiColors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 1, rotate: 200 }}
            transition={{ duration: big ? 1.4 : 0.9, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}
