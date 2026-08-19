import { AuthConfig, AuthSession } from '../types';
import { getFirebaseAuthConfig, saveFirebaseAuthConfig } from '../firebase';

export const AUTH_CONFIG_STORAGE_KEY = 'ffl_auth_config_v2';
export const AUTH_SESSION_STORAGE_KEY = 'ffl_auth_session_v2';

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  adminUsername: 'admin',
  adminPassword: 'admin2026',
  viewerUsername: 'viewer',
  viewerPassword: 'ffl2026',
};

// Aliases for viewer to make it extra flexible for multiple users
export const VIEWER_ALIASES = ['viewer', 'player', 'ffl2026', 'guest', 'user'];

export function loadAuthConfig(): AuthConfig {
  try {
    const saved = localStorage.getItem(AUTH_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.adminUsername && parsed.adminPassword) {
        return {
          adminUsername: parsed.adminUsername || DEFAULT_AUTH_CONFIG.adminUsername,
          adminPassword: parsed.adminPassword || DEFAULT_AUTH_CONFIG.adminPassword,
          viewerUsername: parsed.viewerUsername || DEFAULT_AUTH_CONFIG.viewerUsername,
          viewerPassword: parsed.viewerPassword || DEFAULT_AUTH_CONFIG.viewerPassword,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load auth config', e);
  }
  return { ...DEFAULT_AUTH_CONFIG };
}

export function saveAuthConfig(config: AuthConfig): void {
  try {
    localStorage.setItem(AUTH_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save auth config', e);
  }

  // Sync to Firebase Cloud
  saveFirebaseAuthConfig(config).catch(() => {});

  fetch('/api/auth-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  }).catch(err => {
    console.warn('Failed to sync auth config to server', err);
  });
}

export async function fetchServerAuthConfig(): Promise<AuthConfig | null> {
  // Check Firebase Firestore first
  try {
    const fbAuth = await getFirebaseAuthConfig();
    if (fbAuth && fbAuth.adminPassword) {
      localStorage.setItem(AUTH_CONFIG_STORAGE_KEY, JSON.stringify(fbAuth));
      return fbAuth;
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/auth-config', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.adminPassword) {
        localStorage.setItem(AUTH_CONFIG_STORAGE_KEY, JSON.stringify(data));
        saveFirebaseAuthConfig(data).catch(() => {});
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch auth config from server', e);
  }
  return null;
}

export function loadAuthSession(): AuthSession | null {
  try {
    const saved = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.role && (parsed.role === 'admin' || parsed.role === 'viewer')) {
        return parsed as AuthSession;
      }
    }
  } catch (e) {
    console.error('Failed to load auth session', e);
  }
  return null;
}

export function saveAuthSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save auth session', e);
  }
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export function authenticate(
  usernameInput: string,
  passwordInput: string,
  config: AuthConfig
): AuthResult {
  const trimmedUser = usernameInput.trim().toLowerCase();
  const trimmedPass = passwordInput.trim();

  if (!trimmedUser || !trimmedPass) {
    return {
      success: false,
      error: 'Please enter both User ID and Password',
    };
  }

  // Check Admin credentials
  if (
    trimmedUser === config.adminUsername.toLowerCase() &&
    trimmedPass === config.adminPassword
  ) {
    return {
      success: true,
      session: {
        username: config.adminUsername,
        role: 'admin',
        displayName: 'League Admin',
        loggedInAt: Date.now(),
      },
    };
  }

  // Check Viewer credentials (matches custom viewer username or common aliases)
  const isViewerUser =
    trimmedUser === config.viewerUsername.toLowerCase() ||
    VIEWER_ALIASES.includes(trimmedUser);

  if (isViewerUser && trimmedPass === config.viewerPassword) {
    return {
      success: true,
      session: {
        username: trimmedUser,
        role: 'viewer',
        displayName: 'FFL Viewer',
        loggedInAt: Date.now(),
      },
    };
  }

  return {
    success: false,
    error: 'Invalid User ID or Password. Please verify and try again.',
  };
}

export const getAuthConfig = loadAuthConfig;
export const getCurrentSession = loadAuthSession;
export const logoutSession = () => saveAuthSession(null);

