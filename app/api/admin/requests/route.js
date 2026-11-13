import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth';
import { db, currentExhibition } from '../../../../lib/db';
import { makeCode } from '../../../../lib/code';
import { clean } from '../../../../lib/util';

function back(req, params) {
  return NextResponse.redirect(new URL('/admin/permintaan?' + new URLSearchParams(params).toString(), req.url), 303);
}

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const form = await req.formData();
  const mode = String(form.get('mode') || '');
  const id = clean(form.get('id'), 60);
  if (!id) return back(req, { err: 'Data tidak ditemukan.' });
  const sb = db();

  if (mode === 'convert') {
    const { data: r } = await sb.from('invitation_requests').select('*').eq('id', id).maybeSingle();
    if (!r) return back(req, { err: 'Data tidak ditemukan.' });
    const ex = await currentExhibition();
    if (r.exhibition_id && r.exhibition_id !== ex.id) return back(req, { err: 'Permintaan ini untuk pameran lain.' });
    if (r.whatsapp) {
      const { data: dup } = await sb.from('invitations').select('id').eq('exhibition_id', ex.id).eq('whatsapp', r.whatsapp).limit(1);
      if (dup && dup.length) {
        await sb.from('invitation_requests').update({ handled_at: new Date().toISOString() }).eq('id', id);
        return back(req, { ok: `${r.name} sudah ada di daftar undangan. Permintaan ditandai selesai.` });
      }
    }
    const { error } = await sb.from('invitations').insert({ exhibition_id: ex.id, code: makeCode(), name: r.name, category: 'VIP', organization: r.organization, whatsapp: r.whatsapp, email: r.email, max_guests: 2 });
    if (error) { console.error(error); return back(req, { err: 'Gagal membuat undangan.' }); }
    await sb.from('invitation_requests').update({ handled_at: new Date().toISOString() }).eq('id', id);
    return back(req, { ok: `Undangan untuk ${r.name} dibuat. Kirim lewat halaman Undangan.` });
  }
  if (mode === 'done' || mode === 'reopen') {
    await sb.from('invitation_requests').update({ handled_at: mode === 'done' ? new Date().toISOString() : null }).eq('id', id);
    return back(req, { ok: mode === 'done' ? 'Ditandai selesai.' : 'Dikembalikan ke daftar baru.', ...(mode === 'reopen' ? { t: 'selesai' } : {}) });
  }
  if (mode === 'delete') {
    await sb.from('invitation_requests').delete().eq('id', id);
    return back(req, { ok: 'Permintaan dihapus.' });
  }
  return back(req, { err: 'Perintah tidak dikenal.' });
}
