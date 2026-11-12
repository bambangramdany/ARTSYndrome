import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id kosong' }, { status: 400 });
  // Keep the first send time; resends don't overwrite it.
  await db().from('invitations').update({ sent_at: new Date().toISOString() }).eq('id', id).is('sent_at', null);
  return NextResponse.json({ ok: true });
}
