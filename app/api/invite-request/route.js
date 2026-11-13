import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getExhibition } from '../../../lib/catalog';
import { clean, isEmail, normalizePhone, ROLES } from '../../../lib/util';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true }); // honeypot
  const name = clean(body.name, 120);
  const email = clean(body.email, 160)?.toLowerCase() || null;
  const whatsapp = normalizePhone(body.whatsapp);
  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
  if (email && !isEmail(email)) return NextResponse.json({ error: 'Alamat email belum benar.' }, { status: 400 });
  if (body.whatsapp && !whatsapp) return NextResponse.json({ error: 'Nomor WhatsApp belum benar.' }, { status: 400 });
  if (!email && !whatsapp) return NextResponse.json({ error: 'Isi email atau nomor WhatsApp.' }, { status: 400 });
  if (!body.consent) return NextResponse.json({ error: 'Persetujuan dihubungi wajib dicentang.' }, { status: 400 });

  const slug = clean(body.exhibition, 80);
  const ex = slug ? await getExhibition(slug) : null;
  const sb = db();
  // Orang yang sama untuk pameran yang sama tidak dicatat dua kali.
  let q = sb.from('invitation_requests').select('id').limit(1);
  q = ex ? q.eq('exhibition_id', ex.id) : q.is('exhibition_id', null);
  q = whatsapp ? q.eq('whatsapp', whatsapp) : q.eq('email', email);
  const { data: dup } = await q;
  if (dup && dup.length) return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await sb.from('invitation_requests').insert({
    exhibition_id: ex ? ex.id : null, name, email, whatsapp,
    organization: clean(body.organization, 120),
    roles: Array.isArray(body.roles) ? body.roles.filter((r) => ROLES.includes(r)) : [],
    note: clean(body.note, 500), consent: true
  });
  if (error) { console.error('[invite-request]', error); return NextResponse.json({ error: 'Gagal mengirim. Coba lagi.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
