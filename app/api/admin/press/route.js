import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth';
import { db, currentExhibition } from '../../../../lib/db';
import { clean } from '../../../../lib/util';
import { fetchPressMeta, outletFromUrl, shorten, toDateOnly } from '../../../../lib/press';

export const dynamic = 'force-dynamic';

function back(req, params) {
  return NextResponse.redirect(new URL('/admin/liputan?' + new URLSearchParams(params).toString(), req.url), 303);
}

function normalizeUrl(raw) {
  const s = clean(raw, 1000);
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : 'https://' + s;
  try {
    const u = new URL(withScheme);
    // Buang parameter pelacak supaya link yang sama tidak tersimpan dua kali.
    [...u.searchParams.keys()].forEach((k) => { if (/^(utm_|fbclid|gclid|igshid|mc_)/i.test(k)) u.searchParams.delete(k); });
    u.hash = '';
    return u.toString();
  } catch { return null; }
}

function manualFields(form) {
  const f = {
    title: clean(form.get('title'), 300),
    outlet: clean(form.get('outlet'), 120),
    published_on: toDateOnly(clean(form.get('published_on'), 30)),
    excerpt: shorten(clean(form.get('excerpt'), 600)),
    image_url: clean(form.get('image_url'), 1000)
  };
  if (f.image_url && !/^https?:\/\//i.test(f.image_url)) f.image_url = null;
  return f;
}

export async function POST(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const form = await req.formData();
  const mode = String(form.get('mode') || 'add');
  const sb = db();

  if (mode === 'add') {
    const url = normalizeUrl(form.get('url'));
    if (!url) return back(req, { err: 'Link berita tidak valid.' });
    const manual = manualFields(form);
    let meta = {}; let warn = '';
    try { meta = await fetchPressMeta(url); } catch (e) { warn = e.message || 'Data tidak terbaca otomatis.'; console.warn('[press] ambil gagal', url, warn); }
    // Isian manual selalu menang atas hasil otomatis.
    const row = { ...meta };
    Object.entries(manual).forEach(([k, v]) => { if (v) row[k] = v; });
    if (!row.title) return back(req, { err: (warn ? warn + ' ' : 'Judul tidak terbaca otomatis. ') + 'Isi judul di bagian "Isi manual", lalu simpan lagi.', url });
    if (!row.outlet) row.outlet = outletFromUrl(url);
    const ex = await currentExhibition();
    const { error } = await sb.from('press_links').insert({ exhibition_id: ex.id, url, ...row });
    if (error) {
      if (error.code === '23505') return back(req, { err: 'Link ini sudah ada di daftar.' });
      console.error(error);
      return back(req, { err: 'Gagal menyimpan. Coba lagi.' });
    }
    return back(req, { ok: `Ditambahkan: ${row.title}` + (warn ? ' (sebagian data diisi manual)' : '') });
  }

  const id = clean(form.get('id'), 60);
  if (!id) return back(req, { err: 'Data tidak ditemukan.' });

  if (mode === 'update') {
    const f = manualFields(form);
    if (!f.title) return back(req, { err: 'Judul tidak boleh kosong.' });
    const { error } = await sb.from('press_links').update(f).eq('id', id);
    if (error) { console.error(error); return back(req, { err: 'Gagal menyimpan perubahan.' }); }
    return back(req, { ok: 'Perubahan disimpan.' });
  }
  if (mode === 'toggle') {
    const hidden = form.get('hidden') === 'true';
    await sb.from('press_links').update({ hidden }).eq('id', id);
    return back(req, { ok: hidden ? 'Disembunyikan dari halaman publik.' : 'Ditampilkan di halaman publik.' });
  }
  if (mode === 'refresh') {
    const { data } = await sb.from('press_links').select('url').eq('id', id).maybeSingle();
    if (!data) return back(req, { err: 'Data tidak ditemukan.' });
    try {
      const meta = await fetchPressMeta(data.url);
      const patch = Object.fromEntries(Object.entries(meta).filter(([, v]) => v));
      const { error } = await sb.from('press_links').update(patch).eq('id', id);
      if (error) { console.error('[press] refresh gagal simpan', error); return back(req, { err: 'Gagal menyimpan hasil ambil ulang.' }); }
      console.info('[press] refresh ok', data.url, '->', patch.title);
      return back(req, { ok: 'Data diambil ulang dari situs.' });
    } catch (e) { console.warn('[press] refresh gagal', data.url, e.message); return back(req, { err: e.message || 'Gagal mengambil ulang.' }); }
  }
  if (mode === 'delete') {
    await sb.from('press_links').delete().eq('id', id);
    return back(req, { ok: 'Link dihapus.' });
  }
  return back(req, { err: 'Perintah tidak dikenal.' });
}
