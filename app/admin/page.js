import Link from 'next/link';
import { AdminShell } from '../../components/Shell';
import { requireAdmin } from '../../lib/auth';
import { db, currentExhibition, allExhibitions } from '../../lib/db';
import { displayPhone, fmtRange, fmtTime } from '../../lib/util';
import { GUEST_FILTERS, filterGuests, inPeriod, scopeByPeriod, resolveGuestFolder } from '../../lib/guests';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Database tamu · ARTSYndrome', robots: { index: false, follow: false } };

export default async function AdminGuests({ searchParams }) {
  requireAdmin('/admin');
  const active = await currentExhibition();
  const { list, ex, w } = await resolveGuestFolder(searchParams, { allExhibitions, currentExhibition: async () => active });
  const { data } = await db().from('guests').select('*').eq('exhibition_id', ex.id).order('created_at', { ascending: false });
  const everyone = data || [];
  const outside = everyone.filter((g) => !inPeriod(g, ex)).length;
  const all = scopeByPeriod(everyone, ex, w);
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
  const base = { ...(ex.slug !== active.slug ? { ex: ex.slug } : {}), ...(w !== 'periode' ? { w } : {}) };
  const qs = (nf, wv = w) => '?' + new URLSearchParams({ ...(base.ex ? { ex: base.ex } : {}), ...(wv !== 'periode' ? { w: wv } : {}), ...(nf !== 'Semua' ? { f: nf } : {}), ...(q ? { q } : {}) }).toString();
  const folderHref = (slug) => '/admin' + (slug === active.slug ? '' : '?' + new URLSearchParams({ ex: slug }).toString());
  const exportHref = (fmt) => { const p = new URLSearchParams({ ex: ex.slug, ...(w !== 'periode' ? { w } : {}), ...(f !== 'Semua' ? { f } : {}), ...(q ? { q } : {}), ...(fmt ? { format: fmt } : {}) }); return '/api/admin/export?' + p.toString(); };

  return (
    <AdminShell active="/admin">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Database tamu</p>
          <h1 className="h2 admin-title">{ex.title}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{ex.artist} · {ex.venue} · {fmtRange(ex.starts_on, ex.ends_on)}</p>
          {ex.slug === active.slug ? <p className="small mono">Buku tamu aktif · QR /bukutamu mengarah ke sini</p> : null}
          {w === 'luar' ? <p className="small mono">Isian di luar {fmtRange(ex.starts_on, ex.ends_on)}: data uji sebelum pameran dan isian setelah pameran selesai.</p> : null}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn-line" href={'/admin' + qs(f)}>Muat ulang</Link>
          <a className="btn-dark" href={exportHref('xlsx')}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            Ekspor Excel
          </a>
          <a className="btn-line" href={exportHref()}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            Ekspor CSV
          </a>
        </div>
      </div>

      {list.length > 1 ? (
        <nav aria-label="Folder tamu per pameran" className="toolbar pills-scroll" style={{ marginTop: 24 }}>
          {list.map((e) => (
            <Link key={e.id} className="pill" href={folderHref(e.slug)} aria-current={e.slug === ex.slug ? 'true' : undefined}>
              {e.title}{e.slug === active.slug ? ' · aktif' : ''}
            </Link>
          ))}
        </nav>
      ) : null}

      <nav aria-label="Waktu isi buku tamu" className="toolbar pills-scroll" style={{ marginTop: 24 }}>
        {[
          ['periode', `Masa pameran · ${everyone.length - outside}`],
          ['luar', `Di luar masa pameran · ${outside}`],
          ['semua', `Semua waktu · ${everyone.length}`]
        ].map(([mode, label]) => (
          <Link key={mode} className="pill" href={'/admin' + qs(f, mode)} aria-current={mode === w ? 'true' : undefined}>{label}</Link>
        ))}
      </nav>

      <div className="tiles">
        {stats.map(([label, n]) => <div key={label}><span>{label}</span><strong>{n}</strong></div>)}
      </div>

      <form className="toolbar" method="get" action="/admin">
        {f !== 'Semua' ? <input type="hidden" name="f" value={f} /> : null}
        {base.ex ? <input type="hidden" name="ex" value={base.ex} /> : null}
        {base.w ? <input type="hidden" name="w" value={base.w} /> : null}
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
