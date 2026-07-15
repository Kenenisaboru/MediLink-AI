import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MediLink AI — Next.js Edge Middleware
 *
 * Responsibilities:
 *  1. Redirect unauthenticated users away from /dashboard/* to /auth
 *  2. Redirect authenticated users away from /auth back to their dashboard
 *  3. Enforce role-based path access (e.g. a PATIENT can't visit /dashboard/admin)
 *
 * Token is read from the `medilink_token` cookie which is mirrored from
 * localStorage by `frontend/src/lib/auth.ts` at login time.
 *
 * NOTE: Full JWT verification would require the secret here — for now we do a
 * lightweight structural check and rely on the API to enforce real auth.
 * A server-side JWT verify can be added by importing jose.
 */

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard'];

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/auth'];

// Role → allowed dashboard prefixes
const ROLE_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ['/dashboard/admin'],
  HOSPITAL_ADMIN: ['/dashboard/hospital-admin'],
  DOCTOR: ['/dashboard/doctor'],
  NURSE: ['/dashboard/doctor'],
  LAB_STAFF: ['/dashboard/laboratory'],
  PHARMACY: ['/dashboard/pharmacy'],
  AMBULANCE_DRIVER: ['/dashboard/ambulance'],
  PATIENT: ['/dashboard/patient'],
};

function decodeTokenRole(token: string): string | null {
  try {
    // JWT is three base64url-encoded segments separated by dots
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    // Base64url → base64
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the token cookie (set by auth.ts on login)
  const token = request.cookies.get('medilink_token')?.value ?? null;
  const isLoggedIn = !!token;

  // 1. If visiting /auth while already logged in → redirect to appropriate dashboard
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isLoggedIn) {
    const role = decodeTokenRole(token!);
    const destination = role && ROLE_PATHS[role] ? ROLE_PATHS[role][0] : '/dashboard/patient';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. If visiting a protected route while NOT logged in → redirect to /auth
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based dashboard access enforcement
  if (pathname.startsWith('/dashboard') && isLoggedIn) {
    const role = decodeTokenRole(token!);
    if (role) {
      const allowedPaths = ROLE_PATHS[role] ?? ['/dashboard/patient'];
      const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        // Redirect to their correct dashboard instead of 403
        return NextResponse.redirect(new URL(allowedPaths[0], request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
