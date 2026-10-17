import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publishContent, useContent } from '../../data/content';
import type { L, SiteContent } from '../../content/types';

const SECTIONS = [
  ['basics', 'Basics'],
  ['venue', 'The day & venue'],
  ['story', 'Our story'],
  ['extras', 'On-site extras'],
  ['program', 'Program'],
  ['attire', 'Attire'],
  ['registry', 'Registry'],
  ['faq', 'FAQ'],
] as const;
type SectionId = (typeof SECTIONS)[number][0];

const emptyL = (): L => ({ en: '', fr: '' });
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function Text({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="afield">
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** One piece of copy, English and French side by side. */
function Bi({ label, value, onChange, rows = 1 }: { label: string; value: L; onChange: (v: L) => void; rows?: number }) {
  const input = (lang: 'en' | 'fr') =>
    rows > 1 ? (
      <textarea rows={rows} value={value[lang]} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
    ) : (
      <input value={value[lang]} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
    );
  return (
    <div className="bi">
      <label className="afield">
        {label} <span className="bi__lang">EN</span>
        {input('en')}
      </label>
      <label className="afield">
        {label} <span className="bi__lang">FR</span>
        {input('fr')}
      </label>
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  make,
  render,
  addLabel,
  itemLabel,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  make: () => T;
  render: (item: T, set: (v: T) => void, i: number) => ReactNode;
  addLabel: string;
  itemLabel: (item: T, i: number) => string;
}) {
  const move = (i: number, d: number) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="list-ed">
      {items.map((item, i) => (
        <fieldset key={i} className="list-ed__item">
          <legend>{itemLabel(item, i)}</legend>
          <div className="list-ed__tools">
            <button type="button" className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="icon-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button type="button" className="icon-btn" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
          {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
        </fieldset>
      ))}
      <button type="button" className="abtn abtn--dashed" onClick={() => onChange([...items, make()])}>
        + {addLabel}
      </button>
    </div>
  );
}

export default function ContentEditor() {
  const live = useContent();
  const [params, setParams] = useSearchParams();
  const section = (params.get('s') as SectionId) || 'basics';
  const [draft, setDraft] = useState<SiteContent>(() => clone(live));
  const [base, setBase] = useState(() => JSON.stringify(live));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const dirty = JSON.stringify(draft) !== base;

  // Pick up changes published from elsewhere while there's nothing unsaved here.
  useEffect(() => {
    const s = JSON.stringify(live);
    if (!dirty && s !== base) {
      setDraft(clone(live));
      setBase(s);
    }
  }, [live, dirty, base]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const up = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setDraft({ ...draft, [k]: v });

  const publish = async () => {
    setBusy(true);
    setMsg('');
    try {
      await publishContent(draft);
      setBase(JSON.stringify(draft));
      setMsg('Published ✓');
    } catch (e) {
      setMsg('Could not publish: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const d = draft;
  return (
    <div className="apage">
      <header className="apage__head">
        <div>
          <div className="admin-muted small">{dirty ? 'Unpublished changes' : msg || 'Everything is live'}</div>
          <h1 className="admin-h1">Site content</h1>
        </div>
        <div className="row-wrap">
          <button type="button" className="abtn abtn--outline" disabled={!dirty || busy} onClick={() => setDraft(clone(live))}>
            Discard
          </button>
          <button type="button" className="abtn abtn--navy" disabled={!dirty || busy} onClick={publish}>
            {busy ? 'Publishing…' : 'Publish changes'}
          </button>
        </div>
      </header>

      <div className="editor">
        <nav className="editor__nav" aria-label="Sections">
          {SECTIONS.map(([id, label]) => (
            <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setParams({ s: id })}>
              {label}
            </button>
          ))}
        </nav>

        <section className="acard editor__panel">
          {section === 'basics' && (
            <>
              <h2 className="ah2">Basics</h2>
              <div className="grid2">
                <Text label="Partner 1" value={d.couple.a} onChange={(v) => up('couple', { ...d.couple, a: v })} />
                <Text label="Partner 2" value={d.couple.b} onChange={(v) => up('couple', { ...d.couple, b: v })} />
                <Text label="Wedding date" type="date" value={d.date} onChange={(v) => up('date', v)} />
                <Text label="RSVP deadline" type="date" value={d.rsvpDeadline} onChange={(v) => up('rsvpDeadline', v)} />
                <Text label="Contact email (for lost links)" type="email" value={d.contactEmail} onChange={(v) => up('contactEmail', v)} />
                <label className="afield afield--check">
                  <input type="checkbox" checked={d.rsvpClosed} onChange={(e) => up('rsvpClosed', e.target.checked)} />
                  Close RSVPs now (guests can no longer change answers)
                </label>
              </div>
              <Bi label="Hero kicker" value={d.hero.kicker} onChange={(v) => up('hero', { ...d.hero, kicker: v })} />
              <Bi label="Hero line" rows={3} value={d.hero.line} onChange={(v) => up('hero', { ...d.hero, line: v })} />
              <Text
                label="Hero photo URL"
                value={d.hero.photo}
                placeholder="/photos/hero.jpg or https://…"
                onChange={(v) => up('hero', { ...d.hero, photo: v })}
              />
            </>
          )}

          {section === 'venue' && (
            <>
              <h2 className="ah2">The day &amp; venue</h2>
              <div className="grid2">
                <Text label="Ceremony time" type="time" value={d.ceremonyTime} onChange={(v) => up('ceremonyTime', v)} />
                <Text label="Party ends" type="time" value={d.endTime} onChange={(v) => up('endTime', v)} />
                <Text label="Venue name" value={d.venue.name} onChange={(v) => up('venue', { ...d.venue, name: v })} />
                <Text label="Street address" value={d.venue.address} onChange={(v) => up('venue', { ...d.venue, address: v })} />
                <Text label="City, state, ZIP" value={d.venue.city} onChange={(v) => up('venue', { ...d.venue, city: v })} />
                <Text label="Maps link" value={d.venue.mapsUrl} onChange={(v) => up('venue', { ...d.venue, mapsUrl: v })} />
                <Text label="Venue photo URL (replaces the map)" value={d.venue.photo} onChange={(v) => up('venue', { ...d.venue, photo: v })} />
              </div>
              <Bi label="Getting there" rows={3} value={d.venue.travel} onChange={(v) => up('venue', { ...d.venue, travel: v })} />
            </>
          )}

          {section === 'story' && (
            <>
              <h2 className="ah2">Our story</h2>
              <Bi label="Title" value={d.story.title} onChange={(v) => up('story', { ...d.story, title: v })} />
              <ListEditor
                items={d.story.chapters}
                onChange={(v) => up('story', { ...d.story, chapters: v })}
                make={() => ({ year: '', title: emptyL(), text: emptyL(), photo: '' })}
                addLabel="Add chapter"
                itemLabel={(c, i) => `Chapter ${i + 1}${c.title.en ? ' · ' + c.title.en : ''}`}
                render={(c, set) => (
                  <>
                    <div className="grid2">
                      <Text label="Year" value={c.year} onChange={(v) => set({ ...c, year: v })} />
                      <Text label="Photo URL" value={c.photo} onChange={(v) => set({ ...c, photo: v })} />
                    </div>
                    <Bi label="Title" value={c.title} onChange={(v) => set({ ...c, title: v })} />
                    <Bi label="Text" rows={4} value={c.text} onChange={(v) => set({ ...c, text: v })} />
                  </>
                )}
              />
            </>
          )}

          {section === 'extras' && (
            <>
              <h2 className="ah2">On-site extras</h2>
              <Bi label="Title" value={d.extras.title} onChange={(v) => up('extras', { ...d.extras, title: v })} />
              <Bi label="Intro" rows={2} value={d.extras.intro} onChange={(v) => up('extras', { ...d.extras, intro: v })} />
              <ListEditor
                items={d.extras.items}
                onChange={(v) => up('extras', { ...d.extras, items: v })}
                make={() => ({ title: emptyL(), text: emptyL(), tags: [] })}
                addLabel="Add activity"
                itemLabel={(x, i) => x.title.en || `Activity ${i + 1}`}
                render={(x, set) => (
                  <>
                    <Bi label="Name" value={x.title} onChange={(v) => set({ ...x, title: v })} />
                    <Bi label="Description" rows={3} value={x.text} onChange={(v) => set({ ...x, text: v })} />
                    <Bi
                      label="Tags (comma separated)"
                      value={{ en: x.tags.map((t) => t.en).join(', '), fr: x.tags.map((t) => t.fr).join(', ') }}
                      onChange={(v) => {
                        const en = v.en.split(',').map((s) => s.trim());
                        const fr = v.fr.split(',').map((s) => s.trim());
                        const n = Math.max(en.length, fr.length);
                        set({ ...x, tags: Array.from({ length: n }, (_, i) => ({ en: en[i] ?? '', fr: fr[i] ?? '' })).filter((t) => t.en || t.fr) });
                      }}
                    />
                  </>
                )}
              />
            </>
          )}

          {section === 'program' && (
            <>
              <h2 className="ah2">Program</h2>
              <Bi label="Title" value={d.program.title} onChange={(v) => up('program', { ...d.program, title: v })} />
              <ListEditor
                items={d.program.items}
                onChange={(v) => up('program', { ...d.program, items: v })}
                make={() => ({ time: '', title: emptyL(), detail: emptyL() })}
                addLabel="Add moment"
                itemLabel={(x, i) => `${x.time || '—'} · ${x.title.en || 'Moment ' + (i + 1)}`}
                render={(x, set) => (
                  <>
                    <Text label="Time" type="time" value={x.time} onChange={(v) => set({ ...x, time: v })} />
                    <Bi label="Title" value={x.title} onChange={(v) => set({ ...x, title: v })} />
                    <Bi label="Detail" value={x.detail} onChange={(v) => set({ ...x, detail: v })} />
                  </>
                )}
              />
            </>
          )}

          {section === 'attire' && (
            <>
              <h2 className="ah2">Attire</h2>
              <Bi label="Dress code" value={d.attire.code} onChange={(v) => up('attire', { ...d.attire, code: v })} />
              <Bi label="Guidance" rows={3} value={d.attire.text} onChange={(v) => up('attire', { ...d.attire, text: v })} />
              <Bi label="Please avoid" value={d.attire.avoid} onChange={(v) => up('attire', { ...d.attire, avoid: v })} />
              <ListEditor
                items={d.attire.palette}
                onChange={(v) => up('attire', { ...d.attire, palette: v })}
                make={() => ({ name: emptyL(), hex: '#F2C4CC' })}
                addLabel="Add color"
                itemLabel={(x, i) => x.name.en || `Color ${i + 1}`}
                render={(x, set) => (
                  <>
                    <label className="afield">
                      Color
                      <input type="color" value={x.hex} onChange={(e) => set({ ...x, hex: e.target.value })} />
                    </label>
                    <Bi label="Name" value={x.name} onChange={(v) => set({ ...x, name: v })} />
                  </>
                )}
              />
            </>
          )}

          {section === 'registry' && (
            <>
              <h2 className="ah2">Registry</h2>
              <p className="admin-muted">Use a store registry, funds on the site, or both. Leave both empty to show “coming soon”.</p>
              <Bi label="Title" value={d.registry.title} onChange={(v) => up('registry', { ...d.registry, title: v })} />
              <Bi label="Intro" rows={2} value={d.registry.intro} onChange={(v) => up('registry', { ...d.registry, intro: v })} />
              <div className="subcard">
                <div className="ah3">Store registry</div>
                <p className="admin-muted small">Amazon, Zola, Target… guests buy there and the store tracks what’s been bought.</p>
                <Text
                  label="Registry link"
                  type="url"
                  placeholder="https://www.amazon.com/wedding/…"
                  value={d.registry.externalUrl}
                  onChange={(v) => up('registry', { ...d.registry, externalUrl: v })}
                />
                <Bi label="Button label" value={d.registry.externalLabel} onChange={(v) => up('registry', { ...d.registry, externalLabel: v })} />
              </div>
              <div className="subcard">
                <div className="ah3">Funds on our site</div>
                <p className="admin-muted small">Honeymoon, first home… each card links to your Venmo / PayPal / Zelle page.</p>
                <ListEditor
                  items={d.registry.funds}
                  onChange={(v) => up('registry', { ...d.registry, funds: v })}
                  make={() => ({ title: { en: 'Honeymoon fund', fr: 'Cagnotte lune de miel' }, text: emptyL(), url: '' })}
                  addLabel="Add fund"
                  itemLabel={(x, i) => x.title.en || `Fund ${i + 1}`}
                  render={(x, set) => (
                    <>
                      <Bi label="Name" value={x.title} onChange={(v) => set({ ...x, title: v })} />
                      <Bi label="Description" rows={2} value={x.text} onChange={(v) => set({ ...x, text: v })} />
                      <Text label="Payment link" type="url" placeholder="https://venmo.com/u/…" value={x.url} onChange={(v) => set({ ...x, url: v })} />
                    </>
                  )}
                />
              </div>
              <label className="afield afield--check">
                <input type="checkbox" checked={d.registry.cardBox} onChange={(e) => up('registry', { ...d.registry, cardBox: e.target.checked })} />
                Show the “card box at the reception” card
              </label>
            </>
          )}

          {section === 'faq' && (
            <>
              <h2 className="ah2">FAQ</h2>
              <ListEditor
                items={d.faq}
                onChange={(v) => up('faq', v)}
                make={() => ({ q: emptyL(), a: emptyL() })}
                addLabel="Add question"
                itemLabel={(x, i) => x.q.en || `Question ${i + 1}`}
                render={(x, set) => (
                  <>
                    <Bi label="Question" value={x.q} onChange={(v) => set({ ...x, q: v })} />
                    <Bi label="Answer" rows={3} value={x.a} onChange={(v) => set({ ...x, a: v })} />
                  </>
                )}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
