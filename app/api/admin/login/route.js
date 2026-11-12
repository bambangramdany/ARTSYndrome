import { NextResponse } from 'next/server';
import { checkPassword, setAdminCookie } from '../../../../lib/auth';

export async function POST(req) {
  const form = await req.formData();
  const raw = String(form.get('next') || '/admin');
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin';
  if (!checkPassword(form.get('password'))) {
    // Small delay slows down password guessing.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.redirect(new URL('/admin/login?e=1&next=' + encodeURIComponent(next), req.url), 303);
  }
  setAdminCookie();
  return NextResponse.redirect(new URL(next, req.url), 303);
}
