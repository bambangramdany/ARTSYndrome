import Link from 'next/link';
import { AdminShell } from '../../components/Shell';
import { requireAdmin } from '../../lib/auth';
import { db, currentExhibition } from '../../lib/db';
import { displayPhone, fmtRange, fmtTime } from '../../lib/util';
import { GUEST_FILTERS, filterGuests } from '../../lib/guests';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Database tamu · ARTSYndrome', robots: { index: false, follow: false } };

export default async function AdminGuests({ searchParams }) {
  requireAdmin('/admin');
  const ex = await currentExhibition();
  const { data } = await db().from('guests').select('*').eq('exhibition_id', ex.id).order('created_at', { ascending: false });
  const all = data || [];
  const f = GUEST_FILTERS.includes(searchParams.f) ? searchParams.f : 'Semua';
  const q = typeof searchParams.q === 'string' ? searchParams.q.slice(0, 80) : '';
  const rows = filterGuests(all, f, q);

  const stats = [
    ['Total tamu', all.length],
    ['Lewat undangan', all.filter((g) => g.path === 'Undangan').length],
    ['Walk-in', all.filter((g) => g.path === 'Walk-in').length],
    ['Bersedia diundang', all.filter((g) => g.consent).length],
    ['Baru mengenal seni', all.filter((g) => (g.roles || []).includes('Baru mulai mengenal seni')).length]
  ];
  const qs = (nf) => '?' + new URLSearchParams({ ...(nf !== 'Semua' ? { f: nf } : {}), ...(q ? { q } : {}) }).toString();

  return (
    <AdminShell active="/admin">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Database tamu</p>
          <h1 className="h2 admin-title">{ex.title}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{ex.artist} · {ex.venue} · {fmtRange(ex.starts_on, ex.ends_on)}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn-line" href={'/admin' + qs(f)}>Muat ulang</Link>
          <a className="btn-dark" href={'/api/admin/export' + qs(f)}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            Ekspor CSV
          </a>
        </div>
      </div>

      <div className="tiles">
        {stats.map(([label, n]) => <div key={label}><span>{label}</span><strong>{n}</strong></div>)}
      </div>

      <form className="toolbar" method="get" action="/admin">
        {f !== 'Semua' ? <input type="hidden" name="f" value={f} /> : null}
        <label htmlFor="q" className="sr">Cari tamu</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Cari nama, email, kota, nomor" className="input" style={{ height: 46, flex: '1 1 200px', fontSize: 15 }} />
        <button type="submit" className="btn-line" style={{ height: 46 }}>Cari</button>
      </form>
      <div className="toolbar pills-scroll" style={{ marginTop: 12 }}>
        {GUEST_FILTERS.map((x) => (
          <Link key={x} className="pill" href={'/admin' + qs(x)} aria-current={x === f ? 'true' : undefined}>{x}</Link>
        ))}
      </div>

      <div className="tablebox cards">
        <table style={{ minWidth: 1200 }}>
          <thead>
            <tr><th>Waktu</th><th>Nama</th><th>Jalur</th><th>Datang sebagai</th><th>Kota</th><th>Kontak</th><th>Instagram</th><th>Sumber</th><th>Izin undangan</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9} className="empty">{all.length ? 'Tidak ada tamu yang cocok dengan filter ini.' : 'Belum ada tamu tercatat.'}</td></tr>
            ) : rows.map((g) => (
              <tr key={g.id}>
                <td data-label="Waktu" className="mono" style={{ whiteSpace: 'nowrap', color: '#444' }}>{fmtTime(g.created_at)}</td>
                <td className="c-title" style={{ fontWeight: 600 }}>{g.name}</td>
                <td data-label="Jalur"><span className={g.path === 'Undangan' ? 't-accent' : 't-line'}>{g.path}</span></td>
                <td data-label="Datang sebagai">{(g.roles || []).join(', ') || '—'}</td>
                <td data-label="Kota">{g.city || '—'}</td>
                <td data-label="Kontak" style={{ fontSize: 14 }}><div>{g.email}<br /><span className="mono">{displayPhone(g.whatsapp)}</span></div></td>
                <td data-label="Instagram" style={{ fontSize: 14 }}>{g.instagram || '—'}</td>
                <td data-label="Sumber" style={{ fontSize: 14 }}>{g.source || '—'}</td>
                <td data-label="Izin undangan"><span className={g.consent ? 't-solid' : 't-line'}>{g.consent ? 'Ya' : 'Tidak'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small mono" style={{ marginTop: 12 }}>Menampilkan {rows.length} dari {all.length} tamu. Tamu tanpa izin undangan tetap tercatat, tapi jangan dimasukkan ke daftar kirim.</p>
    </AdminShell>
  );
}
