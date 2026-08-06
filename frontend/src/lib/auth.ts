/**
 * MediLink AI — Auth Token Storage Helpers
 * All token management is centralised here.
 * Uses localStorage for access + refresh tokens.
 * Uses a document cookie mirror so Next.js middleware can read the token
 * on the server edge without having access to localStorage.
 */

const ACCESS_TOKEN_KEY = 'medilink_access_token';
const REFRESH_TOKEN_KEY = 'medilink_refresh_token';
const USER_KEY = 'medilink_user';
const SAVED_PHONE_KEY = 'medilink_saved_phone';
const SAVED_PASSWORD_KEY = 'medilink_saved_password';
const SAVED_REMEMBER_KEY = 'medilink_saved_remember';

export interface StoredUser {
  id: string;
  phone: string;
  email?: string | null;
  role: string;
  isVerified: boolean;
  profile?: Record<string, unknown> | null;
}

export interface SavedCredentials {
  phone: string;
  password: string;
  rememberMe: boolean;
}

// ── Save ────────────────────────────────────────────────────────────────────
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  // Mirror access token into a cookie so Next.js middleware can read it.
  // The cookie is intentionally not HttpOnly because the edge middleware needs access.
  document.cookie = `medilink_token=${accessToken}; path=/; max-age=3600; SameSite=Strict${secureFlag}`;
}

export function saveUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveLoginCredentials(phone: string, password: string, rememberMe: boolean): void {
  if (typeof window === 'undefined') return;
  if (rememberMe) {
    localStorage.setItem(SAVED_PHONE_KEY, phone);
    localStorage.setItem(SAVED_PASSWORD_KEY, password);
    localStorage.setItem(SAVED_REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(SAVED_PHONE_KEY);
    localStorage.removeItem(SAVED_PASSWORD_KEY);
    localStorage.removeItem(SAVED_REMEMBER_KEY);
  }
}

export function getSavedLoginCredentials(): SavedCredentials | null {
  if (typeof window === 'undefined') return null;
  const phone = localStorage.getItem(SAVED_PHONE_KEY);
  const password = localStorage.getItem(SAVED_PASSWORD_KEY);
  const rememberMe = localStorage.getItem(SAVED_REMEMBER_KEY) === 'true';
  if (!phone || !password) return null;
  return { phone, password, rememberMe };
}

export function clearSavedLoginCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVED_PHONE_KEY);
  localStorage.removeItem(SAVED_PASSWORD_KEY);
  localStorage.removeItem(SAVED_REMEMBER_KEY);
}

// ── Read ─────────────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ── Clear ─────────────────────────────────────────────────────────────────────
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Expire the cookie mirror
  document.cookie = 'medilink_token=; path=/; max-age=0';
}

// ── Role-based dashboard routing ──────────────────────────────────────────────
export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SUPER_ADMIN: '/dashboard/admin',
  HOSPITAL_ADMIN: '/dashboard/hospital-admin',
  DOCTOR: '/dashboard/doctor',
  NURSE: '/dashboard/doctor', // Nurses share doctor view for now
  LAB_STAFF: '/dashboard/laboratory',
  PHARMACY: '/dashboard/pharmacy',
  AMBULANCE_DRIVER: '/dashboard/ambulance',
  PATIENT: '/dashboard/patient',
};

export function getDashboardForRole(role: string): string {
  return ROLE_DASHBOARD_MAP[role] ?? '/dashboard/patient';
}
