import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Same Firebase project as the GuestList app. The web apiKey is not a secret —
 * access is enforced by firestore.rules.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCFdVyhj9zFqhHlX8kjEFczHhawCoKuxfs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'guestlist-wedding-7k3m9.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'guestlist-wedding-7k3m9',
  storageBucket: 'guestlist-wedding-7k3m9.firebasestorage.app',
  messagingSenderId: '126934465378',
  appId: '1:126934465378:web:3b2e03f15bd694abf48a3b',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
