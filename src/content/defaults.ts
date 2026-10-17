import type { SiteContent } from './types';

/**
 * Content shown until the couple publishes their own from /admin/content.
 * Anything saved in Firestore (site/content) is merged over this.
 */
export const defaultContent: SiteContent = {
  couple: { a: 'Kalah', b: 'Romaric' },
  date: '2027-06-19',
  ceremonyTime: '',
  endTime: '',
  rsvpDeadline: '',
  rsvpClosed: false,
  contactEmail: '',
  hero: {
    kicker: { en: 'Together with their families', fr: 'Avec leurs familles' },
    line: {
      en: 'invite you to dance, laugh and string a few pearls with us as we say “I do.”',
      fr: 'vous invitent à danser, rire et enfiler quelques perles avec eux pour leur « oui ».',
    },
    photo: '',
  },
  venue: {
    name: 'The Abby – Kruse Plaza',
    address: '5634 Opportunity Blvd',
    city: 'Auburn, IN 46706',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=5634+Opportunity+Blvd+Auburn+IN+46706',
    photo: '',
    travel: {
      en: 'In Auburn, about 25 minutes north of Fort Wayne along I-69.',
      fr: 'À Auburn, à environ 25 minutes au nord de Fort Wayne par l’I-69.',
    },
  },
  story: {
    title: { en: 'How it all began', fr: 'Notre histoire' },
    chapters: [
      {
        year: '',
        title: { en: 'We met', fr: 'La rencontre' },
        text: { en: 'The story of how we met is coming soon.', fr: 'L’histoire de notre rencontre arrive bientôt.' },
        photo: '',
      },
      {
        year: '',
        title: { en: 'We explored', fr: 'Les aventures' },
        text: { en: 'Trips, moves and adventures — more soon.', fr: 'Voyages et aventures — à suivre.' },
        photo: '',
      },
      {
        year: '',
        title: { en: 'We said yes', fr: 'Le oui' },
        text: { en: 'The proposal, told soon.', fr: 'La demande, racontée bientôt.' },
        photo: '',
      },
    ],
  },
  extras: {
    title: { en: 'Little extras all evening', fr: 'De petites surprises toute la soirée' },
    intro: {
      en: 'Open from cocktail hour until late. No tickets, no booking — just wander over.',
      fr: 'Dès le cocktail et jusque tard. Pas de réservation : venez quand vous voulez.',
    },
    items: [
      {
        title: { en: '360° Photobooth', fr: 'Photobooth 360°' },
        text: {
          en: 'Step on the platform, strike a pose, and the camera spins around you. Slow-motion videos are sent straight to your phone.',
          fr: 'Montez sur la plateforme, prenez la pose : la caméra tourne autour de vous. Les vidéos au ralenti arrivent directement sur votre téléphone.',
        },
        tags: [{ en: 'Props provided', fr: 'Accessoires fournis' }],
      },
      {
        title: { en: 'Pearl necklace bar', fr: 'Atelier colliers de perles' },
        text: {
          en: 'Pick your pearls, charms and clasp, and string a necklace or bracelet to take home — a keepsake made by you.',
          fr: 'Choisissez perles, breloques et fermoir, et créez un collier ou un bracelet à emporter — un souvenir fait de vos mains.',
        },
        tags: [
          { en: 'All ages', fr: 'Pour tous' },
          { en: '~15 minutes', fr: '~15 minutes' },
        ],
      },
    ],
  },
  program: {
    title: { en: 'From “I do” to last dance', fr: 'Du « oui » à la dernière danse' },
    items: [
      { time: '', title: { en: 'Guests arrive', fr: 'Arrivée des invités' }, detail: { en: 'Welcome drinks.', fr: 'Boissons d’accueil.' } },
      { time: '', title: { en: 'Ceremony', fr: 'Cérémonie' }, detail: { en: 'Find a seat — tissues provided.', fr: 'Installez-vous — mouchoirs fournis.' } },
      {
        time: '',
        title: { en: 'Cocktail hour', fr: 'Cocktail' },
        detail: { en: 'The 360° photobooth and pearl necklace bar open.', fr: 'Ouverture du photobooth 360° et de l’atelier perles.' },
      },
      { time: '', title: { en: 'Dinner', fr: 'Dîner' }, detail: { en: 'Toasts, speeches and a few surprises.', fr: 'Toasts, discours et quelques surprises.' } },
      { time: '', title: { en: 'First dance', fr: 'Première danse' }, detail: { en: 'Then the dance floor is yours.', fr: 'Puis la piste est à vous.' } },
      { time: '', title: { en: 'Send-off', fr: 'Au revoir' }, detail: { en: 'Safe travels home!', fr: 'Bon retour !' } },
    ],
  },
  attire: {
    code: { en: 'Formal attire', fr: 'Tenue de soirée' },
    text: {
      en: 'Think evening elegance: long gowns or chic cocktail dresses, dark suits or tuxedos. Navy, blush and soft jewel tones are especially welcome.',
      fr: 'Élégance de soirée : robes longues ou robes de cocktail chic, costumes sombres ou smokings. Bleu marine, rose poudré et tons pierres précieuses sont les bienvenus.',
    },
    palette: [
      { name: { en: 'Navy', fr: 'Marine' }, hex: '#1C2B4B' },
      { name: { en: 'Blush', fr: 'Rose poudré' }, hex: '#F2C4CC' },
      { name: { en: 'Dusty blue', fr: 'Bleu gris' }, hex: '#9FB4D6' },
      { name: { en: 'Rose', fr: 'Vieux rose' }, hex: '#D98E9E' },
      { name: { en: 'Lilac', fr: 'Lilas' }, hex: '#C9C3D9' },
    ],
    avoid: { en: 'White, ivory & cream — those are for the bride.', fr: 'Blanc, ivoire et crème — réservés à la mariée.' },
  },
  registry: {
    title: { en: 'Your presence is the gift', fr: 'Votre présence est le plus beau cadeau' },
    intro: {
      en: 'If you’d still like to spoil us, here are a few ideas. Thank you, truly.',
      fr: 'Si vous souhaitez tout de même nous gâter, voici quelques idées. Merci du fond du cœur.',
    },
    externalUrl: '',
    externalLabel: { en: 'View our registry', fr: 'Voir notre liste' },
    funds: [],
    cardBox: true,
  },
  faq: [
    {
      q: { en: 'Can I bring a plus-one?', fr: 'Puis-je venir accompagné(e) ?' },
      a: {
        en: 'If your invitation includes a guest, you’ll see the option when you RSVP.',
        fr: 'Si votre invitation inclut un(e) invité(e), l’option apparaîtra lors de votre réponse.',
      },
    },
    {
      q: { en: 'Can I change my RSVP?', fr: 'Puis-je modifier ma réponse ?' },
      a: {
        en: 'Yes — just reopen your personal link before the RSVP deadline.',
        fr: 'Oui — rouvrez simplement votre lien personnel avant la date limite.',
      },
    },
  ],
};
