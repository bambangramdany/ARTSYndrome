import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id kosong' }, { status: 400 });
  await db().from('invitations').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
