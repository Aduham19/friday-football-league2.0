import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { LeagueData, AuthConfig } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the designated Firestore Database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Document paths
const LEAGUE_DOC_PATH = 'league/main_season_2026';
const AUTH_CONFIG_DOC_PATH = 'settings/auth_config';

/**
 * Subscribe to real-time live updates from Firebase Cloud Firestore
 */
export function subscribeToFirebaseLeague(
  onData: (data: LeagueData) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const docRef = doc(db, 'league', 'main_season_2026');
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
  try {
    const docRef = doc(db, 'league', 'main_season_2026');
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
    const docRef = doc(db, 'league', 'main_season_2026');
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
  try {
    const docRef = doc(db, 'settings', 'auth_config');
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
  try {
    const docRef = doc(db, 'settings', 'auth_config');
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (e) {
    console.warn('Could not save auth config to Firebase:', e);
    return false;
  }
}
