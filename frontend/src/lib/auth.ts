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

export interface StoredUser {
  id: string;
  phone: string;
  email?: string | null;
  role: string;
  isVerified: boolean;
  profile?: Record<string, unknown> | null;
}

// ── Save ────────────────────────────────────────────────────────────────────
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Mirror access token into a cookie so Next.js middleware can read it
  document.cookie = `medilink_token=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
}

export function saveUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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
