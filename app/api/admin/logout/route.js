import { NextResponse } from 'next/server';
import { clearAdminCookie } from '../../../../lib/auth';

export async function GET(req) {
  clearAdminCookie();
  return NextResponse.redirect(new URL('/admin/login', req.url), 303);
}
