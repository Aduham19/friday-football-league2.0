import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Firestore, Unsubscribe } from 'firebase/firestore';
import { LeagueData, AuthConfig } from './types';
import rawFirebaseConfig from '../firebase-applet-config.json';

/**
 * The Firebase config file is injected by the hosting platform and can legitimately
 * be empty (for example on a public deploy where no Firebase project is attached).
 * Initialising Firestore without a projectId throws, so every access is guarded and
 * the app silently falls back to the Netlify API + local storage instead of crashing.
 */
const firebaseConfig = (rawFirebaseConfig || {}) as Record<string, string>;

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey
);

let cachedDb: Firestore | null = null;
let firebaseInitFailed = false;

function getDb(): Firestore | null {
  if (!isFirebaseConfigured || firebaseInitFailed) return null;
  if (cachedDb) return cachedDb;
  try {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    cachedDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    return cachedDb;
  } catch (e) {
    firebaseInitFailed = true;
    console.warn('Firebase is not available, continuing without cloud sync:', e);
    return null;
  }
}

/**
 * Subscribe to real-time live updates from Firebase Cloud Firestore
 */
export function subscribeToFirebaseLeague(
  onData: (data: LeagueData) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const database = getDb();
  if (!database) return () => {};

  try {
    const docRef = doc(database, 'league', 'main_season_2026');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as LeagueData;
          if (remoteData && Array.isArray(remoteData.players)) {
            onData(remoteData);
          }
        }
      },
      (error) => {
        console.warn('Firestore live subscription notice:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to set up Firestore live snapshot listener:', err);
    return () => {};
  }
}

/**
 * Fetch current league data from Firebase Cloud Firestore once
 */
export async function getFirebaseLeagueData(): Promise<LeagueData | null> {
  const database = getDb();
  if (!database) return null;

  try {
    const docRef = doc(database, 'league', 'main_season_2026');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as LeagueData;
      if (data && Array.isArray(data.players)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not read from Firebase Firestore directly:', e);
  }
  return null;
}

/**
 * Save & sync league data directly to Firebase Cloud Firestore for real-time broadcast to all devices
 */
export async function saveFirebaseLeagueData(data: LeagueData): Promise<boolean> {
  const database = getDb();
  if (!database) return false;

  try {
    if (!data || !Array.isArray(data.players)) {
      return false;
    }
    const cleanData = {
      players: data.players,
      matches: data.matches || [],
      matchResults: data.matchResults || {},
      deletedPlayerIds: data.deletedPlayerIds || [],
      deletedPlayerNames: data.deletedPlayerNames || [],
      lastUpdated: data.lastUpdated || Date.now()
    };
    const docRef = doc(database, 'league', 'main_season_2026');
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (e) {
    console.warn('Failed to save to Firebase Firestore:', e);
    return false;
  }
}

/**
 * Fetch authentication and security credentials from Firebase Firestore
 */
export async function getFirebaseAuthConfig(): Promise<AuthConfig | null> {
  const database = getDb();
  if (!database) return null;

  try {
    const docRef = doc(database, 'settings', 'auth_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AuthConfig;
    }
  } catch (e) {
    console.warn('Could not read auth config from Firebase:', e);
  }
  return null;
}

/**
 * Save authentication and security credentials to Firebase Firestore
 */
export async function saveFirebaseAuthConfig(config: AuthConfig): Promise<boolean> {
  const database = getDb();
  if (!database) return false;

  try {
    const docRef = doc(database, 'settings', 'auth_config');
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (e) {
    console.warn('Could not save auth config to Firebase:', e);
    return false;
  }
}
