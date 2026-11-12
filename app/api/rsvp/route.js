import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { clean, COVERAGE } from '../../../lib/util';

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }
  const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  if (!['yes', 'maybe', 'no'].includes(b.answer)) return NextResponse.json({ error: 'Pilih salah satu jawaban.' }, { status: 400 });

  const sb = db();
  const { data: inv } = await sb.from('invitations').select('id, max_guests, category').eq('code', code).maybeSingle();
  if (!inv) return NextResponse.json({ error: 'Undangan tidak ditemukan.' }, { status: 404 });

  const yes = b.answer === 'yes';
  const guests = yes ? Math.min(Math.max(parseInt(b.guests, 10) || 1, 1), inv.max_guests || 1) : null;
  const update = {
    rsvp: b.answer,
    rsvp_guests: guests,
    companion: yes && guests > 1 ? clean(b.companion, 200) : null,
    job_title: yes && inv.category === 'Brand' ? clean(b.jobTitle, 120) : null,
    coverage: yes && inv.category === 'Media' && Array.isArray(b.coverage) ? b.coverage.filter((c) => COVERAGE.includes(c)) : null,
    wants_presskit: yes && inv.category === 'Media' ? !!b.presskit : null,
    note: yes ? clean(b.note, 300) : null,
    rsvp_at: new Date().toISOString()
  };
  const { error } = await sb.from('invitations').update(update).eq('id', inv.id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menyimpan. Coba lagi.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
