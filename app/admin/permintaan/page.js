import Link from 'next/link';
import { AdminShell } from '../../../components/Shell';
import ConfirmSubmit from '../../../components/ConfirmSubmit';
import { requireAdmin } from '../../../lib/auth';
import { db, currentExhibition } from '../../../lib/db';
import { displayPhone, fmtTime } from '../../../lib/util';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Permintaan undangan · ARTSYndrome', robots: { index: false, follow: false } };

export default async function AdminRequests({ searchParams }) {
  requireAdmin('/admin/permintaan');
  const active = await currentExhibition();
  const { data, error } = await db().from('invitation_requests').select('*, exhibitions(slug,title)').order('created_at', { ascending: false });
  const all = data || [];
  const tab = searchParams.t === 'selesai' ? 'selesai' : 'baru';
  const rows = all.filter((r) => (tab === 'baru' ? !r.handled_at : r.handled_at));
  const notice = typeof searchParams.ok === 'string' ? searchParams.ok : '';
  const err = typeof searchParams.err === 'string' ? searchParams.err : '';

  return (
    <AdminShell active="/admin/permintaan">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Dari form publik artsyndrome.id/undangan</p>
          <h1 className="h2 admin-title">Permintaan undangan</h1>
          <p className="lead" style={{ fontSize: 15 }}>{all.filter((r) => !r.handled_at).length} baru · {all.filter((r) => r.handled_at).length} sudah ditindaklanjuti</p>
        </div>
      </div>
      {notice ? <p className="small" role="status" style={{ marginTop: 20, padding: '12px 16px', border: '1px solid #111', color: '#111' }}>{notice}</p> : null}
      {err ? <p className="error" role="alert" style={{ marginTop: 20 }}>{err}</p> : null}
      {error ? <p className="error" role="alert" style={{ marginTop: 20 }}>Tabel permintaan belum dibuat di database. Jalankan bagian &quot;Tahap 1b&quot; dari supabase/schema.sql.</p> : null}
      <div className="toolbar pills-scroll">
        <Link className="pill" href="/admin/permintaan" aria-current={tab === 'baru' ? 'true' : undefined}>Baru</Link>
        <Link className="pill" href="/admin/permintaan?t=selesai" aria-current={tab === 'selesai' ? 'true' : undefined}>Sudah ditindaklanjuti</Link>
      </div>
      <div className="tablebox cards">
        <table style={{ minWidth: 1100 }}>
          <thead><tr><th>Nama</th><th>Untuk pameran</th><th>Kontak</th><th>Instansi</th><th>Datang sebagai</th><th>Catatan</th><th>Masuk</th><th>Aksi</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={8} className="empty">{tab === 'baru' ? 'Belum ada permintaan baru.' : 'Belum ada yang ditindaklanjuti.'}</td></tr> : rows.map((r) => {
              const forActive = r.exhibition_id ? r.exhibition_id === active.id : true;
              return (
                <tr key={r.id}>
                  <td className="c-title" style={{ fontWeight: 600 }}>{r.name}</td>
                  <td data-label="Pameran">{r.exhibitions?.title || 'Semua pameran berikutnya'}</td>
                  <td data-label="Kontak" style={{ fontSize: 14 }}><div>{r.whatsapp ? <span className="mono">{displayPhone(r.whatsapp)}</span> : null}{r.whatsapp && r.email ? <br /> : null}{r.email || null}</div></td>
                  <td data-label="Instansi">{r.organization || '—'}</td>
                  <td data-label="Datang sebagai">{(r.roles || []).join(', ') || '—'}</td>
                  <td data-label="Catatan" style={{ fontSize: 14 }}>{r.note || '—'}</td>
                  <td data-label="Masuk" className="mono" style={{ color: '#444' }}>{fmtTime(r.created_at)}</td>
                  <td className="c-actions">
                    <div className="actions">
                      {!r.handled_at && forActive ? (
                        <form method="post" action="/api/admin/requests"><input type="hidden" name="mode" value="convert" /><input type="hidden" name="id" value={r.id} /><button type="submit" title={`Buat undangan ${active.title}`}>Jadikan undangan</button></form>
                      ) : null}
                      <form method="post" action="/api/admin/requests"><input type="hidden" name="mode" value={r.handled_at ? 'reopen' : 'done'} /><input type="hidden" name="id" value={r.id} /><button type="submit">{r.handled_at ? 'Tandai baru' : 'Tandai selesai'}</button></form>
                      <form method="post" action="/api/admin/requests"><input type="hidden" name="mode" value="delete" /><input type="hidden" name="id" value={r.id} /><ConfirmSubmit message={`Hapus permintaan dari ${r.name}?`}>Hapus</ConfirmSubmit></form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: 12 }}>&quot;Jadikan undangan&quot; membuat undangan {active.title} (kategori VIP, maks. 2 orang) di halaman Undangan, lalu menandai permintaan ini selesai. Kategori dan jumlah orang bisa diubah dengan menghapus lalu menambah ulang undangan.</p>
    </AdminShell>
  );
}
