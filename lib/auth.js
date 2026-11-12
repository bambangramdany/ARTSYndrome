import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'artsy_admin';

function token() {
  const secret = process.env.SESSION_SECRET || '';
  const pass = process.env.ADMIN_PASSWORD || '';
  // Changing ADMIN_PASSWORD or SESSION_SECRET logs every device out.
  return crypto.createHmac('sha256', secret).update('admin:' + pass).digest('hex');
}

export function checkPassword(input) {
  const pass = process.env.ADMIN_PASSWORD || '';
  if (!pass || !process.env.SESSION_SECRET) return false;
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(pass);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function setAdminCookie() {
  cookies().set(COOKIE, token(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE);
}

export function isAdmin() {
  const v = cookies().get(COOKIE)?.value;
  if (!v || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) return false;
  const t = token();
  return v.length === t.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(t));
}

export function requireAdmin(next = '/admin') {
  if (!isAdmin()) redirect('/admin/login?next=' + encodeURIComponent(next));
}
