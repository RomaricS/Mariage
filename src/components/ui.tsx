import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '../i18n';

/** Fade + rise as a section scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LangToggle({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`lang-toggle lang-toggle--${tone}`} role="group" aria-label="Language / Langue">
      {(['en', 'fr'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Monogram({ a, b }: { a: string; b: string }) {
  return (
    <span className="monogram">
      {a[0]}
      <em>&amp;</em>
      {b[0]}
    </span>
  );
}

export function Names({ a, b, br = false }: { a: string; b: string; br?: boolean }) {
  return (
    <>
      {a}
      {br ? <br /> : ' '}
      <em className="amp">&amp;</em> {b}
    </>
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
