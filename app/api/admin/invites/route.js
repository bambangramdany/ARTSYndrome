import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth';
import { db, currentExhibition } from '../../../../lib/db';
import { makeCode } from '../../../../lib/code';
import { clean, isEmail, normalizePhone } from '../../../../lib/util';

const CATS = ['VIP', 'Brand', 'Media'];

function toRow(exId, r) {
  const name = clean(r.name, 120);
  if (!name) return { error: 'nama kosong' };
  const catRaw = clean(r.category, 20) || 'VIP';
  const category = CATS.find((c) => c.toLowerCase() === catRaw.toLowerCase());
  if (!category) return { error: `kategori "${catRaw}" tidak dikenal` };
  const email = clean(r.email, 160)?.toLowerCase() || null;
  if (email && !isEmail(email)) return { error: `email "${email}" tidak valid` };
  const max = Math.min(Math.max(parseInt(r.max_guests, 10) || 2, 1), 10);
  return {
    row: {
      exhibition_id: exId, code: makeCode(), name, category,
      organization: clean(r.organization, 120), whatsapp: normalizePhone(r.whatsapp), email, max_guests: max
    }
  };
}

function back(req, params) {
  return NextResponse.redirect(new URL('/admin/undangan?' + new URLSearchParams(params).toString(), req.url), 303);
}

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const form = await req.formData();
  const ex = await currentExhibition();
  const rows = [];
  const problems = [];

  if (form.get('mode') === 'bulk') {
    const lines = String(form.get('bulk') || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, n) => {
      const parts = (line.includes('\t') ? line.split('\t') : line.split(';')).map((p) => p.trim());
      if (n === 0 && /^nama$/i.test(parts[0])) return; // header row
      const [name, category, organization, whatsapp, email, max_guests] = parts;
      const r = toRow(ex.id, { name, category, organization, whatsapp, email, max_guests });
      if (r.error) problems.push(`baris ${n + 1}: ${r.error}`); else rows.push(r.row);
    });
  } else {
    const r = toRow(ex.id, Object.fromEntries(form.entries()));
    if (r.error) problems.push(r.error); else rows.push(r.row);
  }

  if (rows.length) {
    const { error } = await db().from('invitations').insert(rows);
    if (error) {
      console.error(error);
      return back(req, { err: 'Gagal menyimpan undangan. Coba lagi.' });
    }
  }
  const params = {};
  if (rows.length) params.ok = `${rows.length} undangan ditambahkan.`;
  if (problems.length) params.err = 'Dilewati: ' + problems.slice(0, 8).join('; ') + (problems.length > 8 ? ` (+${problems.length - 8} lagi)` : '');
  if (!rows.length && !problems.length) params.err = 'Tidak ada data yang dikirim.';
  return back(req, params);
}
