import { NextResponse } from 'next/server';
import { currentExhibition } from '../../lib/db';

// Alamat pendek untuk QR dan tablet meja tamu: selalu ke buku tamu pameran aktif.
// Pameran aktif dipilih dari tanggal (lihat lib/db.js), jadi QR yang sudah tercetak
// tetap terpakai untuk pameran berikutnya tanpa cetak ulang.
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const ex = await currentExhibition();
  return NextResponse.redirect(new URL(`/pameran/${ex.slug}/buku-tamu`, req.url), 307);
}
