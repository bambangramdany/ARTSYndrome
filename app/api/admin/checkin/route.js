import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const form = await req.formData();
  const code = String(form.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const sb = db();
  const { data: inv } = await sb.from('invitations').select('*').eq('code', code).maybeSingle();
  if (!inv) return new Response('Undangan tidak ditemukan', { status: 404 });

  if (!inv.checked_in_at) {
    await sb.from('invitations').update({ checked_in_at: new Date().toISOString() }).eq('id', inv.id);
  }
  // One guest-book row per invitation (unique index); a repeat scan is ignored.
  const { error } = await sb.from('guests').insert({
    exhibition_id: inv.exhibition_id,
    invitation_id: inv.id,
    path: 'Undangan',
    name: inv.name,
    email: inv.email,
    whatsapp: inv.whatsapp,
    roles: inv.category === 'Media' ? ['Media / jurnalis'] : [],
    source: 'Undangan',
    consent: false
  });
  if (error && error.code !== '23505') console.error(error);

  return NextResponse.redirect(new URL(`/c/${inv.code}?done=1`, req.url), 303);
}
