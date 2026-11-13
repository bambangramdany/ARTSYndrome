import Link from 'next/link';
import { AdminShell } from '../../../components/Shell';
import ConfirmSubmit from '../../../components/ConfirmSubmit';
import PressImage from '../../../components/PressImage';
import { requireAdmin } from '../../../lib/auth';
import { db, currentExhibition } from '../../../lib/db';
import { fmtDate } from '../../../lib/util';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Liputan media · ARTSYndrome', robots: { index: false, follow: false } };

export default async function AdminPress({ searchParams }) {
  requireAdmin('/admin/liputan');
  const ex = await currentExhibition();
  const { data, error } = await db().from('press_links').select('*').eq('exhibition_id', ex.id)
    .order('published_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  const rows = data || [];
  const notice = typeof searchParams.ok === 'string' ? searchParams.ok : '';
  const err = typeof searchParams.err === 'string' ? searchParams.err : '';
  const prefillUrl = typeof searchParams.url === 'string' ? searchParams.url : '';
  const shown = rows.filter((r) => !r.hidden).length;

  return (
    <AdminShell active="/admin/liputan">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Liputan media</p>
          <h1 className="h2 admin-title">{ex.title}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{rows.length} link · {shown} tampil di halaman publik</p>
        </div>
        <Link className="btn-line" href="/liputan" target="_blank">Lihat halaman publik</Link>
      </div>

      {notice ? <p className="small" role="status" style={{ marginTop: 20, padding: '12px 16px', border: '1px solid #111', color: '#111' }}>{notice}</p> : null}
      {err ? <p className="error" role="alert" style={{ marginTop: 20 }}>{err}</p> : null}
      {error ? <p className="error" role="alert" style={{ marginTop: 20 }}>Tabel liputan belum dibuat di database. Jalankan bagian &quot;press_links&quot; dari supabase/schema.sql.</p> : null}

      <form className="box" method="post" action="/api/admin/press" style={{ marginTop: 28 }}>
        <input type="hidden" name="mode" value="add" />
        <h2 className="h2" style={{ fontSize: 24 }}>Tambah link berita</h2>
        <div className="field">
          <label htmlFor="p-url">Link berita <span className="req">(wajib)</span></label>
          <input id="p-url" name="url" type="url" inputMode="url" className="input" required placeholder="https://" defaultValue={prefillUrl} maxLength={1000} />
        </div>
        <p className="small">Judul, nama media, tanggal, cuplikan, dan gambar diambil otomatis dari link. Bila ada yang tidak terbaca atau keliru, isi di bawah atau ubah setelah disimpan.</p>
        <details className="press-manual" open={!!prefillUrl}>
          <summary>Isi manual (opsional)</summary>
          <div className="field"><label htmlFor="p-title">Judul</label><input id="p-title" name="title" className="input" maxLength={300} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="p-outlet">Nama media</label><input id="p-outlet" name="outlet" className="input" maxLength={120} placeholder="Kompas.com" /></div>
            <div className="field"><label htmlFor="p-date">Tanggal terbit</label><input id="p-date" name="published_on" type="date" className="input" /></div>
          </div>
          <div className="field"><label htmlFor="p-excerpt">Cuplikan (1–2 kalimat)</label><textarea id="p-excerpt" name="excerpt" className="input" rows={3} maxLength={600} /></div>
        </details>
        <button type="submit" className="btn" style={{ height: 52, fontSize: 16 }}>Simpan link</button>
      </form>

      <div className="press-admin-list">
        {rows.length === 0 ? <p className="empty" style={{ border: '1px solid #111' }}>Belum ada link berita.</p> : rows.map((r) => (
          <article key={r.id} className="press-admin-item" data-hidden={r.hidden ? 'true' : undefined}>
            <div className="press-admin-thumb"><PressImage src={r.image_url} alt="" /></div>
            <div className="press-admin-body">
              <p className="eyebrow" style={{ fontSize: 11 }}>{[r.outlet, fmtDate(r.published_on)].filter(Boolean).join(' · ')}</p>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="press-admin-title">{r.title}</a>
              <span className={r.hidden ? 't-line' : 't-solid'} style={{ alignSelf: 'flex-start' }}>{r.hidden ? 'Disembunyikan' : 'Tampil'}</span>
              <div className="actions">
                <form method="post" action="/api/admin/press"><input type="hidden" name="mode" value="toggle" /><input type="hidden" name="id" value={r.id} /><input type="hidden" name="hidden" value={r.hidden ? 'false' : 'true'} /><button type="submit">{r.hidden ? 'Tampilkan' : 'Sembunyikan'}</button></form>
                <form method="post" action="/api/admin/press"><input type="hidden" name="mode" value="refresh" /><input type="hidden" name="id" value={r.id} /><button type="submit">Ambil ulang</button></form>
                <form method="post" action="/api/admin/press"><input type="hidden" name="mode" value="delete" /><input type="hidden" name="id" value={r.id} /><ConfirmSubmit message={`Hapus link "${r.title}"?`}>Hapus</ConfirmSubmit></form>
              </div>
              <details className="press-manual">
                <summary>Ubah data</summary>
                <form method="post" action="/api/admin/press" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input type="hidden" name="mode" value="update" /><input type="hidden" name="id" value={r.id} />
                  <div className="field"><label htmlFor={`t-${r.id}`}>Judul</label><input id={`t-${r.id}`} name="title" className="input" defaultValue={r.title} required maxLength={300} /></div>
                  <div className="row2">
                    <div className="field"><label htmlFor={`o-${r.id}`}>Nama media</label><input id={`o-${r.id}`} name="outlet" className="input" defaultValue={r.outlet || ''} maxLength={120} /></div>
                    <div className="field"><label htmlFor={`d-${r.id}`}>Tanggal terbit</label><input id={`d-${r.id}`} name="published_on" type="date" className="input" defaultValue={r.published_on || ''} /></div>
                  </div>
                  <div className="field"><label htmlFor={`e-${r.id}`}>Cuplikan</label><textarea id={`e-${r.id}`} name="excerpt" className="input" rows={3} defaultValue={r.excerpt || ''} maxLength={600} /></div>
                  <div className="field"><label htmlFor={`i-${r.id}`}>Link gambar sampul</label><input id={`i-${r.id}`} name="image_url" type="url" className="input" defaultValue={r.image_url || ''} maxLength={1000} /></div>
                  <button type="submit" className="btn-dark" style={{ alignSelf: 'flex-start' }}>Simpan perubahan</button>
                </form>
              </details>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
