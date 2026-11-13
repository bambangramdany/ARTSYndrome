import Link from 'next/link';
import { PublicShell } from '../../components/Shell';
import PressImage from '../../components/PressImage';
import { db, currentExhibition } from '../../lib/db';
import { decodeAll } from '../../lib/press';
import { fmtDate, fmtRange } from '../../lib/util';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const ex = await currentExhibition().catch(() => null);
  const t = ex ? `Liputan media · ${ex.title} · ARTSYndrome` : 'Liputan media · ARTSYndrome';
  return { title: t, description: ex ? `Kumpulan liputan media tentang pameran ${ex.title} oleh ${ex.artist}.` : undefined };
}

export default async function PressPage() {
  const ex = await currentExhibition();
  const { data } = await db().from('press_links').select('id,url,title,outlet,published_on,excerpt,image_url')
    .eq('exhibition_id', ex.id).eq('hidden', false)
    .order('published_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  const rows = (data || []).map((r) => ({ ...r, title: decodeAll(r.title), outlet: decodeAll(r.outlet), excerpt: decodeAll(r.excerpt) }));

  return (
    <PublicShell exhibition={ex}>
      <div className="wrap press-page">
        <header className="press-head">
          <p className="eyebrow">Liputan media · {fmtRange(ex.starts_on, ex.ends_on)}</p>
          <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>{ex.title}</h1>
          <p className="artist">{ex.artist} · {ex.venue}</p>
        </header>

        {rows.length === 0 ? (
          <p className="lead press-empty">Liputan media tentang pameran ini akan tampil di sini.</p>
        ) : (
          <ul className="press-grid" aria-label="Daftar liputan">
            {rows.map((r) => (
              <li key={r.id} className="press-card">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="press-link">
                  <div className="press-img"><PressImage src={r.image_url} alt="" /></div>
                  <div className="press-body">
                    <p className="eyebrow" style={{ fontSize: 12 }}>{[r.outlet, fmtDate(r.published_on)].filter(Boolean).join(' · ')}</p>
                    <h2 className="press-title">{r.title}</h2>
                    {r.excerpt ? <p className="press-excerpt">{r.excerpt}</p> : null}
                    <span className="press-more">Baca di {r.outlet || 'situs media'} <span aria-hidden="true">↗</span></span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="small" style={{ marginTop: 40 }}>Artikel adalah milik masing-masing media dan dibuka di situs aslinya. <Link href="/">Isi buku tamu</Link></p>
      </div>
    </PublicShell>
  );
}
