import { NextResponse } from 'next/server';
import { EXHIBITION_SLUG } from '../../lib/db';

// Alamat pendek untuk QR dan tablet meja tamu: selalu ke buku tamu pameran aktif.
export const dynamic = 'force-dynamic';
export function GET(req) {
  return NextResponse.redirect(new URL(`/pameran/${EXHIBITION_SLUG}/buku-tamu`, req.url), 307);
}
