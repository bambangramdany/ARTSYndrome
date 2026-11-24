import Link from 'next/link';
import { AdminShell } from '../../../components/Shell';
import { requireAdmin } from '../../../lib/auth';
import { db, currentExhibition, allExhibitions } from '../../../lib/db';
import { PERIOD_MODES } from '../../../lib/guests';
import { loadReport, reportView, fmtPct, PERIOD_LABEL } from '../../../lib/report';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Laporan · ARTSYndrome', robots: { index: false, follow: false } };

const num = (v, d = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }).format(v);

// Grafik batang horizontal satu seri: label, batang, lalu jumlah + persen tertulis.
// Angka selalu terlihat (tidak bergantung warna atau hover), jadi grafik sekaligus tabel.
function Bars({ section }) {
  const { rows, base, title, note, key } = section;
  const max = Math.max(1, ...rows.map((r) => r.pct));
  return (
    <section className="rp-card" aria-labelledby={`rp-${key}`}>
      <div className="rp-card-head">
        <h2 id={`rp-${key}`} className="rp-title">{title}</h2>
        <p className="rp-base mono">n = {num(base)}</p>
      </div>
      {note ? <p className="rp-note">{note}</p> : null}
      {base === 0 ? <p className="rp-note">Belum ada data.</p> : (
        <table className="rp-bars">
          <caption className="sr">{title}: jumlah dan persen dari {num(base)}</caption>
          <colgroup><col className="rp-c-label" /><col /><col className="rp-c-n" /><col className="rp-c-pct" /></colgroup>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} title={`${r.label}: ${num(r.n)} dari ${num(base)} (${fmtPct(r.pct)})`}>
                <th scope="row" className="rp-label">{r.label}</th>
                <td className="rp-track" aria-hidden="true"><span className="rp-fill" style={{ width: `${Math.max(r.n ? 0.6 : 0, (r.pct / max) * 100)}%` }} /></td>
                <td className="rp-n mono">{num(r.n)}</td>
                <td className="rp-pct mono">{fmtPct(r.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function Report({ searchParams }) {
  requireAdmin('/admin/laporan');
  const w = PERIOD_MODES.includes(searchParams.w) ? searchParams.w : 'periode';
  const slug = typeof searchParams.ex === 'string' ? searchParams.ex : 'semua';
  const r = await loadReport(db(), { slug, w, allExhibitions, currentExhibition });
  const v = reportView(r, w);
  const { one, scopeTitle, scopeSub, tiles, footnote, sections, inviteSections } = v;

  const href = (over) => {
    const p = { ex: slug, w, ...over };
    const q = new URLSearchParams({ ...(p.ex !== 'semua' ? { ex: p.ex } : {}), ...(p.w !== 'periode' ? { w: p.w } : {}) }).toString();
    return '/admin/laporan' + (q ? '?' + q : '');
  };
  const exportHref = (fmt) => '/api/admin/report?' + new URLSearchParams({ ex: slug, w, ...(fmt ? { format: fmt } : {}) }).toString();
  return (
    <AdminShell active="/admin/laporan">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Laporan buku tamu · {PERIOD_LABEL[w]}</p>
          <h1 className="h2 admin-title">{scopeTitle}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{scopeSub}</p>
        </div>
        <div className="noprint" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn-dark" href={exportHref('xlsx')}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            Ekspor Excel
          </a>
          <a className="btn-line" href={exportHref()}>Ekspor CSV</a>
          <a className="btn-line" href={exportHref('pdf')}>Unduh PDF</a>
        </div>
      </div>

      <nav aria-label="Pilih pameran" className="toolbar pills-scroll noprint" style={{ marginTop: 24 }}>
        <Link className="pill" href={href({ ex: 'semua' })} aria-current={r.all ? 'true' : undefined}>Semua pameran</Link>
        {r.list.map((e) => (
          <Link key={e.id} className="pill" href={href({ ex: e.slug })} aria-current={!r.all && one?.id === e.id ? 'true' : undefined}>
            {e.title}{e.id === r.active.id ? ' · aktif' : ''}
          </Link>
        ))}
      </nav>
      <nav aria-label="Waktu isi buku tamu" className="toolbar pills-scroll noprint" style={{ marginTop: 12 }}>
        {PERIOD_MODES.map((m) => (
          <Link key={m} className="pill" href={href({ w: m })} aria-current={m === w ? 'true' : undefined}>{PERIOD_LABEL[m]}</Link>
        ))}
      </nav>

      <div className="tiles">
        {tiles.map(([label, v, sub]) => (
          <div key={label}><span>{label}</span><strong>{v}</strong>{sub ? <span className="small mono" style={{ color: 'var(--muted)' }}>{sub}</span> : null}</div>
        ))}
      </div>
      <p className="small mono" style={{ marginTop: 12 }}>
        {footnote}
      </p>

      <h2 className="h2 rp-group">Tamu</h2>
      <div className="rp-grid">
        {sections.map((s) => <Bars key={s.key} section={s} />)}
      </div>

      {inviteSections.length ? (
        <>
          <h2 className="h2 rp-group">Undangan</h2>
          <p className="small mono">Seluruh undangan pada pameran terpilih, tidak disaring waktu isi.</p>
          <div className="rp-grid">
            {inviteSections.map((s) => <Bars key={s.key} section={s} />)}
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}
