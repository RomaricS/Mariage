import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '../data/content';
import { fetchInvite, rememberedToken } from '../data/invites';
import { useI18n } from '../i18n';
import type { Invite } from '../lib/model';
import { downloadIcs } from '../lib/calendar';
import { LangToggle, Monogram, Names, Reveal, useNow } from '../components/ui';
import {
  CalendarIcon,
  CameraIcon,
  CloseIcon,
  GiftIcon,
  HeartIcon,
  MenuIcon,
  PearlsIcon,
  PinIcon,
  PlaneIcon,
  Sparkle,
  StarIcon,
} from '../components/Icons';

function useMyInvite() {
  const [invite, setInvite] = useState<Invite | null>(null);
  useEffect(() => {
    const token = rememberedToken();
    if (token) fetchInvite(token).then(setInvite).catch(() => setInvite(null));
  }, []);
  return invite;
}

export default function Home() {
  const invite = useMyInvite();
  return (
    <div className="site">
      <Nav invite={invite} />
      <Hero invite={invite} />
      <Ribbon />
      <Story />
      <TheDay />
      <Extras />
      <Program />
      <Attire />
      <Registry />
      <RsvpBand invite={invite} />
      <Faq />
      <Footer />
      {invite && <MobileRsvpBar invite={invite} />}
    </div>
  );
}

function rsvpPath(invite: Invite | null) {
  return invite ? `/i/${invite.token}/rsvp` : '#rsvp';
}

function Nav({ invite }: { invite: Invite | null }) {
  const c = useContent();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const links: [string, Parameters<typeof t>[0]][] = [
    ['#story', 'navStory'],
    ['#details', 'navDay'],
    ['#program', 'navProgram'],
    ['#attire', 'navAttire'],
    ['#registry', 'navRegistry'],
    ['#faq', 'navFaq'],
  ];
  return (
    <header className="nav">
      <nav className="nav__inner wrap">
        <a href="#top" className="nav__brand" aria-label="Home">
          <Monogram a={c.couple.a} b={c.couple.b} />
        </a>
        <div className={`nav__links${open ? ' is-open' : ''}`} id="nav-links">
          {links.map(([href, key]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {t(key)}
            </a>
          ))}
        </div>
        <div className="nav__actions">
          <LangToggle />
          {invite ? (
            <Link to={rsvpPath(invite)} className="btn btn--cream btn--sm">
              {t('rsvp')}
            </Link>
          ) : (
            <a href="#rsvp" className="btn btn--cream btn--sm">
              {t('rsvp')}
            </a>
          )}
          <button
            type="button"
            className="nav__burger"
            aria-label={t('menu')}
            aria-expanded={open}
            aria-controls="nav-links"
            onClick={() => setOpen(!open)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}

function Countdown() {
  const c = useContent();
  const { t } = useI18n();
  const now = useNow();
  const target = new Date(`${c.date}T${c.ceremonyTime || '16:00'}:00`);
  let ms = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(ms / 86400000);
  ms -= d * 86400000;
  const h = Math.floor(ms / 3600000);
  ms -= h * 3600000;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms - m * 60000) / 1000);
  const parts: [number, Parameters<typeof t>[0]][] = [
    [d, 'days'],
    [h, 'hours'],
    [m, 'min'],
    [s, 'sec'],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`${d} ${t('days')}`}>
      {parts.map(([v, k]) => (
        <div key={k} className="countdown__tile">
          <div className="countdown__value">{v}</div>
          <div className="countdown__label">{t(k)}</div>
        </div>
      ))}
    </div>
  );
}

function Hero({ invite }: { invite: Invite | null }) {
  const c = useContent();
  const { t, p, fmtDate } = useI18n();
  const reduce = useReducedMotion();
  const rise = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: 0.15 * i, ease: [0.2, 0.8, 0.2, 1] } };
  return (
    <section id="top" className="hero">
      <Sparkle className="drift hero__spark hero__spark--1" size={34} />
      <Sparkle className="drift-slow hero__spark hero__spark--2" size={18} />
      <Sparkle className="drift hero__spark hero__spark--3" size={24} />
      <div className="hero__inner wrap">
        <div className="hero__text">
          {invite && (
            <motion.div className="hero__welcome" {...rise(0)}>
              {t('welcome')}, <b>{invite.householdName}</b> — {t('madeForYou')}
            </motion.div>
          )}
          <motion.div className="kicker kicker--pink" {...rise(0)}>
            {p(c.hero.kicker)}
          </motion.div>
          <motion.h1 className="hero__names" {...rise(1)}>
            <Names a={c.couple.a} b={c.couple.b} br />
          </motion.h1>
          <motion.p className="hero__line" {...rise(2)}>
            {p(c.hero.line)}
          </motion.p>
          <motion.div className="hero__facts" {...rise(3)}>
            <span>
              <CalendarIcon /> {fmtDate(c.date)}
            </span>
            <span>
              <PinIcon /> {c.venue.name} · {c.venue.city.replace(/\s*\d{5}.*$/, '')}
            </span>
          </motion.div>
          <motion.div {...rise(4)}>
            <Countdown />
          </motion.div>
        </div>
        <motion.div
          className="hero__photo"
          initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="arch arch--back" />
          <div className="arch arch--front">
            {c.hero.photo ? <img src={c.hero.photo} alt={`${c.couple.a} & ${c.couple.b}`} /> : <Monogram a={c.couple.a} b={c.couple.b} />}
          </div>
          <div className="hero__stamp">
            <span>SAVE</span>
            <em>the</em>
            <span>DATE</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Ribbon() {
  const c = useContent();
  const { t, fmtDate } = useI18n();
  const items = [fmtDate(c.date, { month: 'long', day: 'numeric', year: 'numeric' }), c.venue.city.replace(/\s*\d{5}.*$/, ''), `${c.couple.a} & ${c.couple.b}`, t('weMarry')];
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon__track marquee">
        {row.map((x, i) => (
          <span key={i}>
            {x} <span className="ribbon__star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ kicker, title, center = true, light = false }: { kicker: string; title: string; center?: boolean; light?: boolean }) {
  return (
    <Reveal className={`section-head${center ? ' section-head--center' : ''}`}>
      <div className={`kicker${light ? ' kicker--pink' : ''}`}>{kicker}</div>
      <h2 className="h2">{title}</h2>
    </Reveal>
  );
}

function Story() {
  const c = useContent();
  const { t, p } = useI18n();
  return (
    <section id="story" className="section wrap">
      <SectionHead kicker={t('ourStory')} title={p(c.story.title)} />
      <div className="story">
        {c.story.chapters.map((ch, i) => (
          <Reveal key={i} delay={i * 0.12} className={`story__chapter${i % 2 ? ' story__chapter--down' : ''}`}>
            <div className={`arch-photo${i % 2 ? ' arch-photo--navy' : ''}`}>
              {ch.photo ? <img src={ch.photo} alt="" /> : <HeartIcon size={36} />}
            </div>
            <div className="eyebrow">
              {ch.year ? `${ch.year} · ` : ''}
              {t('chapter')} {i + 1}
            </div>
            <h3 className="h3">{p(ch.title)}</h3>
            <p className="body">{p(ch.text)}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TheDay() {
  const c = useContent();
  const { t, p, fmtTime } = useI18n();
  return (
    <section id="details" className="band band--blush">
      <div className="wrap day">
        <Reveal className="day__info">
          <div className="kicker">{t('theDay')}</div>
          <h2 className="h2">{c.venue.name}</h2>
          <p className="day__address">
            {c.venue.address}
            <br />
            {c.venue.city}
          </p>
          <div className="day__times">
            <div className="card-cream">
              <div className="eyebrow">{t('ceremony')}</div>
              <div className="day__time">{c.ceremonyTime ? fmtTime(c.ceremonyTime) : t('timeTba')}</div>
            </div>
            {c.endTime && (
              <div className="card-cream">
                <div className="eyebrow">{t('partyUntil')}</div>
                <div className="day__time">{fmtTime(c.endTime)}</div>
              </div>
            )}
          </div>
          <div className="row-wrap">
            <a className="btn btn--navy" href={c.venue.mapsUrl} target="_blank" rel="noreferrer">
              <PinIcon size={18} /> {t('openMaps')}
            </a>
            <button type="button" className="btn btn--outline" onClick={() => downloadIcs(c)}>
              <CalendarIcon size={18} /> {t('addCalendar')}
            </button>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="day__visual">
          {c.venue.photo ? (
            <img src={c.venue.photo} alt={c.venue.name} />
          ) : (
            <iframe
              title={c.venue.name}
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(`${c.venue.address}, ${c.venue.city}`)}&output=embed`}
            />
          )}
          <div className="day__travel">
            <b>{t('gettingThere')}</b>
            <span>{p(c.venue.travel)}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const extraIcons = [CameraIcon, PearlsIcon, StarIcon];

function Extras() {
  const c = useContent();
  const { t, p } = useI18n();
  return (
    <section className="section wrap">
      <div className="extras__head">
        <SectionHead kicker={t('onSite')} title={p(c.extras.title)} center={false} />
        <Reveal>
          <p className="body extras__intro">{p(c.extras.intro)}</p>
        </Reveal>
      </div>
      <div className="extras">
        {c.extras.items.map((x, i) => {
          const Icon = extraIcons[i % extraIcons.length];
          return (
            <Reveal key={i} delay={i * 0.1} className={`extra extra--${i % 2 ? 'blush' : 'navy'}`}>
              <div className="extra__icon">
                <Icon size={32} />
              </div>
              <h3 className="h3">{p(x.title)}</h3>
              <p className="body">{p(x.text)}</p>
              <div className="tags">
                {x.tags.map((tag, j) => (
                  <span key={j} className="tag">
                    {p(tag)}
                  </span>
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Program() {
  const c = useContent();
  const { t, p, fmtTime } = useI18n();
  return (
    <section id="program" className="band band--navy">
      <div className="wrap wrap--narrow section">
        <SectionHead kicker={t('programLabel')} title={p(c.program.title)} light />
        <ol className="timeline">
          {c.program.items.map((item, i) => (
            <motion.li
              key={i}
              className="timeline__item"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.05 * i }}
            >
              <span className="timeline__dot" aria-hidden="true" />
              {item.time && <div className="timeline__time">{fmtTime(item.time)}</div>}
              <div className="timeline__title">{p(item.title)}</div>
              <div className="timeline__detail">{p(item.detail)}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Attire() {
  const c = useContent();
  const { t, p } = useI18n();
  return (
    <section id="attire" className="section wrap">
      <SectionHead kicker={t('attire')} title={p(c.attire.code)} />
      <Reveal>
        <p className="body body--center attire__text">{p(c.attire.text)}</p>
      </Reveal>
      <div className="looks">
        <Reveal className="look look--blush">
          <svg role="img" aria-label={t('gown')} width="140" height="220" viewBox="0 0 140 220">
            <circle cx="70" cy="22" r="14" fill="#1C2B4B" />
            <path d="M56 44h28l6 40H50z" fill="#1C2B4B" />
            <path d="M50 84h40l30 128H20z" fill="#E3A9B5" />
            <path d="M50 84h40" stroke="#1C2B4B" strokeWidth="4" />
          </svg>
          <div className="look__title">{t('gown')}</div>
          <div className="look__sub">{t('gownSub')}</div>
        </Reveal>
        <Reveal delay={0.1} className="look look--navy">
          <svg role="img" aria-label={t('suit')} width="140" height="220" viewBox="0 0 140 220">
            <circle cx="70" cy="22" r="14" fill="#F2C4CC" />
            <path d="M38 46h64l8 82H30z" fill="#0E1730" stroke="#F2C4CC" strokeWidth="2" />
            <path d="M58 46l12 34 12-34" fill="#FFF8F4" />
            <path d="M62 52l8 4 8-4-8 6z" fill="#F2C4CC" />
            <path d="M46 128h20l-2 80H48zM74 128h20l-2 80H76z" fill="#0E1730" stroke="#F2C4CC" strokeWidth="2" />
          </svg>
          <div className="look__title">{t('suit')}</div>
          <div className="look__sub">{t('suitSub')}</div>
        </Reveal>
        <Reveal delay={0.2} className="look look--cream">
          <svg role="img" aria-label={t('jumpsuit')} width="140" height="220" viewBox="0 0 140 220">
            <circle cx="70" cy="22" r="14" fill="#1C2B4B" />
            <path d="M54 44h32l4 64H50z" fill="#1C2B4B" />
            <path d="M50 108h40l4 100H74l-4-70-4 70H46z" fill="#1C2B4B" />
            <path d="M50 108h40" stroke="#E3A9B5" strokeWidth="6" />
          </svg>
          <div className="look__title">{t('jumpsuit')}</div>
          <div className="look__sub">{t('jumpsuitSub')}</div>
        </Reveal>
      </div>
      <div className="palette-row">
        <Reveal className="panel">
          <div className="panel__title">{t('pleaseWear')}</div>
          <div className="swatches">
            {c.attire.palette.map((s, i) => (
              <div key={i} className="swatch">
                <span style={{ background: s.hex }} />
                {p(s.name)}
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="panel panel--small">
          <div className="panel__title">{t('kindlyAvoid')}</div>
          <div className="avoid">
            <span className="swatch-x" style={{ background: '#FFFFFF' }} />
            <span className="swatch-x" style={{ background: '#F3EBDD' }} />
            <span className="body">{p(c.attire.avoid)}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Registry() {
  const c = useContent();
  const { t, p } = useI18n();
  const r = c.registry;
  const empty = !r.externalUrl && !r.funds.length;
  return (
    <section id="registry" className="band band--blush">
      <div className="wrap section">
        <SectionHead kicker={t('registry')} title={p(r.title)} />
        <Reveal>
          <p className="body body--center">{p(r.intro)}</p>
        </Reveal>
        <div className="gifts">
          {r.funds.map((f, i) => (
            <Reveal key={i} delay={i * 0.1} className="gift">
              <PlaneIcon size={36} className="gift__icon" />
              <h3 className="h3">{p(f.title)}</h3>
              <p className="body">{p(f.text)}</p>
              {f.url && (
                <a className="btn btn--navy gift__cta" href={f.url} target="_blank" rel="noreferrer">
                  {t('contribute')}
                </a>
              )}
            </Reveal>
          ))}
          {r.externalUrl && (
            <Reveal className="gift">
              <GiftIcon size={36} className="gift__icon" />
              <h3 className="h3">{t('registry')}</h3>
              <a className="btn btn--outline gift__cta" href={r.externalUrl} target="_blank" rel="noreferrer">
                {p(r.externalLabel)} ↗
              </a>
            </Reveal>
          )}
          {empty && (
            <Reveal className="gift">
              <GiftIcon size={36} className="gift__icon" />
              <p className="body">{t('registrySoon')}</p>
            </Reveal>
          )}
          {r.cardBox && (
            <Reveal delay={0.1} className="gift">
              <HeartIcon size={36} className="gift__icon" />
              <h3 className="h3">{t('cardBoxTitle')}</h3>
              <p className="body">{t('cardBoxText')}</p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function RsvpBand({ invite }: { invite: Invite | null }) {
  const c = useContent();
  const { t, fmtDate } = useI18n();
  return (
    <section id="rsvp" className="wrap section">
      <Reveal className="rsvp-band">
        <Sparkle className="drift rsvp-band__spark" size={28} />
        <div className="rsvp-band__text">
          <div className="kicker kicker--pink">
            {c.rsvpDeadline ? `${t('rsvpBy')} ${fmtDate(c.rsvpDeadline, { month: 'long', day: 'numeric' })}` : t('rsvpLabel')}
          </div>
          <h2 className="h2">{t('willYou')}</h2>
          <p>{t('rsvpBandText')}</p>
        </div>
        <div className="rsvp-band__cta">
          {invite ? (
            <Link to={`/i/${invite.token}/rsvp`} className="btn btn--pink btn--lg">
              {invite.response ? t('changeAnswer') : t('rsvpForParty')}
            </Link>
          ) : (
            c.contactEmail && (
              <a href={`mailto:${c.contactEmail}`} className="link-light">
                {t('lostLink')}
              </a>
            )
          )}
        </div>
      </Reveal>
    </section>
  );
}

function Faq() {
  const c = useContent();
  const { t, p } = useI18n();
  if (!c.faq.length) return null;
  return (
    <section id="faq" className="wrap wrap--faq faq">
      <h2 className="h2 h2--center">{t('goodToKnow')}</h2>
      <div className="faq__list">
        {c.faq.map((f, i) => (
          <details key={i} className="faq__item">
            <summary>
              {p(f.q)}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{p(f.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const c = useContent();
  const { t, fmtDate } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__names">
          <Names a={c.couple.a} b={c.couple.b} />
        </div>
        <div className="footer__meta">
          {fmtDate(c.date, { month: 'long', day: 'numeric', year: 'numeric' })} · {c.venue.name} · {t('madeWithLove')}
        </div>
      </div>
    </footer>
  );
}

function MobileRsvpBar({ invite }: { invite: Invite }) {
  const { t } = useI18n();
  return (
    <div className="rsvp-bar">
      <div>
        <b>{invite.response ? t('replied') : t('notReplied')}</b>
      </div>
      <Link to={`/i/${invite.token}/rsvp`} className="btn btn--navy btn--sm">
        {invite.response ? t('changeAnswer') : t('rsvp')}
      </Link>
    </div>
  );
}

