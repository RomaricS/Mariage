import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { L, Lang } from './content/types';

const ui = {
  navStory: { en: 'Our story', fr: 'Notre histoire' },
  navDay: { en: 'The day', fr: 'Le jour J' },
  navProgram: { en: 'Program', fr: 'Programme' },
  navAttire: { en: 'Attire', fr: 'Tenue' },
  navRegistry: { en: 'Registry', fr: 'Liste' },
  navFaq: { en: 'FAQ', fr: 'FAQ' },
  rsvp: { en: 'RSVP', fr: 'Répondre' },
  menu: { en: 'Menu', fr: 'Menu' },
  saveTheDate: { en: 'Save the date', fr: 'Réservez la date' },
  days: { en: 'Days', fr: 'Jours' },
  hours: { en: 'Hours', fr: 'Heures' },
  min: { en: 'Min', fr: 'Min' },
  sec: { en: 'Sec', fr: 'Sec' },
  weMarry: { en: 'We’re getting married!', fr: 'On se marie !' },
  ourStory: { en: 'Our story', fr: 'Notre histoire' },
  chapter: { en: 'Chapter', fr: 'Chapitre' },
  theDay: { en: 'The day', fr: 'Le jour J' },
  ceremony: { en: 'Ceremony', fr: 'Cérémonie' },
  partyUntil: { en: 'Party until', fr: 'Fête jusqu’à' },
  timeTba: { en: 'Time to come', fr: 'Horaire à venir' },
  openMaps: { en: 'Open in Maps', fr: 'Ouvrir dans Maps' },
  addCalendar: { en: 'Add to calendar', fr: 'Ajouter au calendrier' },
  gettingThere: { en: 'Getting there', fr: 'Accès' },
  onSite: { en: 'On site', fr: 'Sur place' },
  programLabel: { en: 'Program of the day', fr: 'Programme de la journée' },
  attire: { en: 'Attire', fr: 'Tenue' },
  pleaseWear: { en: 'Our palette — please wear', fr: 'Notre palette — à porter' },
  kindlyAvoid: { en: 'Kindly avoid', fr: 'À éviter' },
  gown: { en: 'Gown or formal cocktail dress', fr: 'Robe longue ou robe de cocktail habillée' },
  gownSub: { en: 'Floor-length or elegant midi', fr: 'Longue ou midi élégante' },
  suit: { en: 'Dark suit or tuxedo', fr: 'Costume sombre ou smoking' },
  suitSub: { en: 'Tie or bow tie, polished shoes', fr: 'Cravate ou nœud papillon, chaussures cirées' },
  jumpsuit: { en: 'Dressy jumpsuit', fr: 'Combinaison habillée' },
  jumpsuitSub: { en: 'Tailored, in an evening fabric', fr: 'Bien coupée, dans un tissu de soirée' },
  registry: { en: 'Registry', fr: 'Liste de mariage' },
  contribute: { en: 'Contribute', fr: 'Participer' },
  cardBoxTitle: { en: 'A card on the day', fr: 'Une carte le jour J' },
  cardBoxText: {
    en: 'There will be a card box at the reception. Kind words are the best part.',
    fr: 'Une urne sera à la réception. Les mots doux sont le plus beau des cadeaux.',
  },
  registrySoon: { en: 'Our registry is coming soon.', fr: 'Notre liste arrive bientôt.' },
  rsvpBy: { en: 'RSVP by', fr: 'Répondez avant le' },
  rsvpLabel: { en: 'RSVP', fr: 'RSVP' },
  willYou: { en: 'Will you celebrate with us?', fr: 'Fêterez-vous avec nous ?' },
  rsvpBandText: {
    en: 'Your invitation came with a personal link — open it to answer for everyone in your party. No account, no password.',
    fr: 'Votre invitation contient un lien personnel — ouvrez-le pour répondre pour tout votre foyer. Sans compte ni mot de passe.',
  },
  openInvite: { en: 'Open my invitation', fr: 'Ouvrir mon invitation' },
  lostLink: { en: 'Lost your link? Write to us', fr: 'Lien perdu ? Écrivez-nous' },
  goodToKnow: { en: 'Good to know', fr: 'Bon à savoir' },
  madeWithLove: { en: 'Made with love', fr: 'Fait avec amour' },
  welcome: { en: 'Welcome', fr: 'Bienvenue' },
  madeForYou: { en: 'this page was made for you.', fr: 'cette page a été faite pour vous.' },
  notReplied: { en: 'You haven’t replied yet', fr: 'Vous n’avez pas encore répondu' },
  replied: { en: 'Thanks — we have your answer', fr: 'Merci — nous avons votre réponse' },
  pleaseRsvp: { en: 'Please RSVP', fr: 'Merci de répondre' },
  changeAnswer: { en: 'Change my answer', fr: 'Modifier ma réponse' },
  // invite
  aNoteFor: { en: 'A note for', fr: 'Un mot pour' },
  invitedTo: { en: 'You’re invited to the wedding of', fr: 'Vous êtes invités au mariage de' },
  tapToOpen: { en: 'Tap the seal to open', fr: 'Touchez le sceau pour ouvrir' },
  kindlyReply: { en: 'Kindly reply by', fr: 'Merci de répondre avant le' },
  rsvpForParty: { en: 'RSVP for your party', fr: 'Répondre pour votre foyer' },
  explore: { en: 'Explore the wedding', fr: 'Découvrir le mariage' },
  inviteNotFound: { en: 'We couldn’t find this invitation', fr: 'Invitation introuvable' },
  inviteNotFoundText: {
    en: 'The link may be incomplete or was replaced. Please check the message we sent you, or reach out to us.',
    fr: 'Le lien est peut-être incomplet ou a été remplacé. Vérifiez le message reçu, ou contactez-nous.',
  },
  backHome: { en: 'Go to the website', fr: 'Aller sur le site' },
  loading: { en: 'Loading…', fr: 'Chargement…' },
  // rsvp
  step: { en: 'Step', fr: 'Étape' },
  of: { en: 'of', fr: 'sur' },
  allDone: { en: 'All done', fr: 'C’est fait' },
  willYouJoin: { en: 'Will you join us?', fr: 'Serez-vous des nôtres ?' },
  eachPerson: { en: 'Let us know for each person on your invitation.', fr: 'Dites-nous pour chaque personne de l’invitation.' },
  accepts: { en: 'Joyfully accepts', fr: 'Avec joie' },
  declines: { en: 'Regretfully declines', fr: 'Avec regret' },
  bringingGuest: { en: 'Bringing a guest?', fr: 'Venez-vous accompagné(e) ?' },
  plusIncluded: { en: 'Your invitation includes a plus-one.', fr: 'Votre invitation inclut un(e) invité(e).' },
  bringPlus: { en: 'Bring a plus-one', fr: 'Venir accompagné(e)' },
  theirName: { en: 'Their full name', fr: 'Son nom complet' },
  yourGuest: { en: 'your guest', fr: 'votre invité(e)' },
  details: { en: 'A few details', fr: 'Quelques détails' },
  dietaryFor: { en: 'Dietary needs', fr: 'Régime alimentaire' },
  dietaryPh: { en: 'Vegetarian, allergies, none…', fr: 'Végétarien, allergies, aucun…' },
  song: { en: 'A song that gets you dancing', fr: 'Une chanson qui vous fait danser' },
  songPh: { en: 'Artist – song', fr: 'Artiste – titre' },
  noteFor: { en: 'A note for us', fr: 'Un mot pour nous' },
  optional: { en: 'Optional', fr: 'Facultatif' },
  continue: { en: 'Continue', fr: 'Continuer' },
  sendAnswer: { en: 'Send my answer', fr: 'Envoyer ma réponse' },
  sendRsvp: { en: 'Send RSVP', fr: 'Envoyer' },
  sending: { en: 'Sending…', fr: 'Envoi…' },
  back: { en: 'Back', fr: 'Retour' },
  thankYou: { en: 'Thank you!', fr: 'Merci !' },
  seeYou: { en: 'See you on the dance floor', fr: 'Rendez-vous sur la piste' },
  missYou: { en: 'We’ll miss you', fr: 'Vous allez nous manquer' },
  savedYes: { en: 'Your answer is saved. You can reopen this link to change it', fr: 'Votre réponse est enregistrée. Rouvrez ce lien pour la modifier' },
  savedNo: { en: 'Thank you for letting us know. You can still change your answer with this link', fr: 'Merci de nous avoir prévenus. Vous pouvez encore changer d’avis avec ce lien' },
  until: { en: 'until', fr: 'jusqu’au' },
  attending: { en: 'Attending', fr: 'Présent(e)' },
  notAttending: { en: 'Not attending', fr: 'Absent(e)' },
  plusOne: { en: 'Plus-one', fr: 'Invité(e)' },
  closed: { en: 'RSVPs are closed', fr: 'Les réponses sont closes' },
  closedText: { en: 'Please contact us directly if something changed.', fr: 'Contactez-nous directement si quelque chose a changé.' },
  sendError: { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Réessayez.' },
  viewSite: { en: 'View the wedding website', fr: 'Voir le site du mariage' },
} satisfies Record<string, L>;

export type UiKey = keyof typeof ui;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: UiKey) => string;
  p: (l: L | undefined) => string;
  fmtDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  fmtTime: (hhmm: string) => string;
}

const LANG_KEY = 'kr.lang';
const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
  const value: I18n = {
    lang,
    setLang,
    t: (k) => ui[k][lang],
    p: (l) => (l ? l[lang] || l.en : ''),
    fmtDate: (iso, opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) =>
      iso ? new Date(iso + 'T12:00:00').toLocaleDateString(locale, opts) : '',
    fmtTime: (hhmm) => {
      if (!/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm;
      const [h, m] = hhmm.split(':').map(Number);
      return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside LangProvider');
  return v;
}
