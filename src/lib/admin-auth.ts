'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: number;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export async function createAdminSession(): Promise<void> {
  const session: AdminSession = {
    isAuthenticated: true,
    loginTime: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TIMEOUT / 1000, // Convert to seconds
    path: '/',
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: AdminSession = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
      await destroyAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function requireAdminAuth(): Promise<void> {
  const session = await getAdminSession();

  if (!session?.isAuthenticated) {
    redirect('/admin/login');
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isAuthenticated || false;
}
