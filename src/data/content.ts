import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { defaultContent } from '../content/defaults';
import type { SiteContent } from '../content/types';
import { mergeContent } from '../lib/merge';

const contentDoc = doc(db, 'site', 'content');

const ContentContext = createContext<SiteContent>(defaultContent);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  useEffect(
    () =>
      onSnapshot(
        contentDoc,
        (snap) => setContent(snap.exists() ? mergeContent(defaultContent, snap.data()) : defaultContent),
        () => setContent(defaultContent),
      ),
    [],
  );
  return createElement(ContentContext.Provider, { value: content }, children);
}

export const useContent = () => useContext(ContentContext);

export function publishContent(content: SiteContent) {
  return setDoc(contentDoc, { ...content, updatedAt: Date.now() });
}

/** RSVPs are closed when the admin says so or the deadline (end of that day) has passed. */
export function rsvpIsClosed(c: SiteContent, now = new Date()): boolean {
  if (c.rsvpClosed) return true;
  if (!c.rsvpDeadline) return false;
  return now > new Date(c.rsvpDeadline + 'T23:59:59');
}
