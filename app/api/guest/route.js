import { NextResponse } from 'next/server';
import { db, currentExhibition } from '../../../lib/db';
import { clean, isEmail, normalizePhone, ROLES, SOURCES } from '../../../lib/util';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }

  // Honeypot filled → pretend success, store nothing.
  if (body.website) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 160)?.toLowerCase() || null;
  const whatsapp = normalizePhone(body.whatsapp);
  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
  if (!email || !isEmail(email)) return NextResponse.json({ error: 'Alamat email belum benar.' }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: 'Nomor WhatsApp belum benar.' }, { status: 400 });

  const roles = Array.isArray(body.roles) ? body.roles.filter((r) => ROLES.includes(r)) : [];
  const source = SOURCES.includes(body.source) ? body.source : null;
  let instagram = clean(body.instagram, 60);
  if (instagram && !instagram.startsWith('@')) instagram = '@' + instagram;

  const ex = await currentExhibition();
  const sb = db();

  // Same person already in today's book? Don't count twice.
  const { data: existing } = await sb.from('guests').select('id').eq('exhibition_id', ex.id).eq('whatsapp', whatsapp).limit(1);
  if (existing && existing.length) return NextResponse.json({ ok: true, duplicate: true });

  // Invited guest who skipped RSVP or forgot the QR: match by WhatsApp number.
  const { data: inv } = await sb.from('invitations').select('id, checked_in_at').eq('exhibition_id', ex.id).eq('whatsapp', whatsapp).limit(1);
  const invitation = inv && inv[0];

  const row = {
    exhibition_id: ex.id,
    invitation_id: invitation ? invitation.id : null,
    path: invitation ? 'Undangan' : 'Walk-in',
    name, email, whatsapp,
    city: clean(body.city, 80),
    instagram, roles, source,
    consent: !!body.consent
  };
  const { error } = await sb.from('guests').insert(row);
  if (error) {
    // Unique index on invitation_id: already checked in via QR.
    if (error.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    console.error(error);
    return NextResponse.json({ error: 'Gagal menyimpan. Coba lagi.' }, { status: 500 });
  }
  if (invitation && !invitation.checked_in_at) {
    await sb.from('invitations').update({ checked_in_at: new Date().toISOString() }).eq('id', invitation.id);
  }
  return NextResponse.json({ ok: true });
}
