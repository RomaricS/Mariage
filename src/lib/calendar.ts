import type { SiteContent } from '../content/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Floating local time (venue time zone) in iCalendar format. */
function icsLocal(date: string, time: string, addHours = 0) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh + addHours, mm);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

export function weddingIcs(c: SiteContent): string {
  const title = `${c.couple.a} & ${c.couple.b} — Wedding`;
  const location = `${c.venue.name}, ${c.venue.address}, ${c.venue.city}`;
  const allDay = !c.ceremonyTime;
  const [y, m, d] = c.date.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  const dtStart = allDay ? `DTSTART;VALUE=DATE:${c.date.replace(/-/g, '')}` : `DTSTART:${icsLocal(c.date, c.ceremonyTime)}`;
  const dtEnd = allDay
    ? `DTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`
    : `DTEND:${icsLocal(c.date, c.ceremonyTime, 8)}`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//kalah-romaric//wedding//EN',
    'BEGIN:VEVENT',
    `UID:wedding-${c.date}@kalah-romaric`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    dtStart,
    dtEnd,
    `SUMMARY:${title}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    `URL:${window.location.origin}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(c: SiteContent) {
  const blob = new Blob([weddingIcs(c)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kalah-romaric-wedding.ics';
  a.click();
  URL.revokeObjectURL(url);
}
