export type Lang = 'en' | 'fr';

/** A piece of copy in both site languages. */
export interface L {
  en: string;
  fr: string;
}

export interface StoryChapter {
  year: string;
  title: L;
  text: L;
  photo: string;
}

export interface Extra {
  title: L;
  text: L;
  tags: L[];
}

export interface ProgramItem {
  time: string;
  title: L;
  detail: L;
}

export interface PaletteColor {
  name: L;
  hex: string;
}

export interface Fund {
  title: L;
  text: L;
  url: string;
}

export interface FaqItem {
  q: L;
  a: L;
}

export interface SiteContent {
  couple: { a: string; b: string };
  /** ISO date, e.g. 2027-06-19 */
  date: string;
  /** 24h time of the ceremony, e.g. 16:00; empty when not decided yet */
  ceremonyTime: string;
  endTime: string;
  /** ISO date after which RSVPs are closed; empty = open */
  rsvpDeadline: string;
  rsvpClosed: boolean;
  contactEmail: string;
  hero: { kicker: L; line: L; photo: string };
  venue: { name: string; address: string; city: string; mapsUrl: string; photo: string; travel: L };
  story: { title: L; chapters: StoryChapter[] };
  extras: { title: L; intro: L; items: Extra[] };
  program: { title: L; items: ProgramItem[] };
  attire: { code: L; text: L; palette: PaletteColor[]; avoid: L };
  registry: {
    title: L;
    intro: L;
    externalUrl: string;
    externalLabel: L;
    funds: Fund[];
    cardBox: boolean;
  };
  faq: FaqItem[];
}
