import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: SEVEN_DAYS_MS,
  };
}

export function setRefreshCookie(response: Response, refreshToken: string) {
  response.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

export function clearRefreshCookie(response: Response) {
  response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}
