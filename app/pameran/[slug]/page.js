import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '../../../components/Shell';
import { PressCard, artistName } from '../../../components/Cards';
import { STATUS_LABEL, getExhibition, guestbookOpen, listPress, paragraphs } from '../../../lib/catalog';
import { fmtRange } from '../../../lib/util';

export const dynamic = 'force-dynamic';

// Jadikan @akun Instagram dan nama domain (contoh: dcdc.id) di teks rilis sebagai tautan.
function linkify(text) {
  return text.split(/(@[A-Za-z0-9._]*[A-Za-z0-9_]|\b[a-z0-9-]+\.(?:id|com|co\.id|org)\b)/g).map((part, i) => {
    if (/^@[A-Za-z0-9._]+$/.test(part)) return <a key={i} href={`https://instagram.com/${part.slice(1)}`} target="_blank" rel="noopener noreferrer">{part}</a>;
    if (/^[a-z0-9-]+\.(id|com|co\.id|org)$/.test(part)) return <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer">{part}</a>;
    return part;
  });
}

export async function generateMetadata({ params }) {
  const ex = await getExhibition(params.slug);
  if (!ex) return { title: 'Pameran · ARTSYndrome' };
  return { title: `${ex.title} · ${artistName(ex)} · ARTSYndrome`, description: paragraphs(ex.description)[0] || `${ex.title} oleh ${artistName(ex)}, ${ex.venue}.`, openGraph: ex.poster_url ? { images: [ex.poster_url] } : undefined };
}

export default async function Exhibition({ params }) {
  const ex = await getExhibition(params.slug);
  if (!ex) notFound();
  const press = await listPress({ exhibitionId: ex.id });
  const open = guestbookOpen(ex);
  const a = ex.artistRow;

  return (
    <PublicShell active="/pameran">
      <div className="wrap split">
        <section className="info" aria-labelledby="judul-pameran">
          <p className="eyebrow"><Link href="/pameran">Pameran</Link> · {STATUS_LABEL[ex.status]}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 id="judul-pameran" className="display">{ex.title}</h1>
            <p className="artist">{a ? <Link href={`/seniman/${a.slug}`}>{a.name}</Link> : ex.artist}</p>
          </div>
          <dl className="meta">
            <div><dt>Tanggal</dt><dd>{fmtRange(ex.starts_on, ex.ends_on)}</dd></div>
            <div><dt>Tempat</dt><dd>{ex.venue}</dd></div>
            {ex.address ? <div><dt>Alamat</dt><dd style={{ fontWeight: 400 }}>{ex.address}</dd></div> : null}
            {ex.opening_label ? <div><dt>Pembukaan</dt><dd style={{ fontWeight: 400 }}>{ex.opening_label}</dd></div> : null}
          </dl>
          {paragraphs(ex.description).map((p, i) => <p key={i} className="about-p">{p}</p>)}
          <div className="ex-card-actions">
            {open && ex.status !== 'past' ? <Link className="btn" href={`/pameran/${ex.slug}/buku-tamu`} style={{ height: 56, fontSize: 17 }}>Isi buku tamu</Link> : null}
            {ex.status !== 'past' ? <Link className="btn-line" href={`/undangan?pameran=${ex.slug}`}>Minta undangan</Link> : null}
            {a ? <Link className="btn-line" href={`/seniman/${a.slug}`}>Profil {a.name}</Link> : null}
          </div>
        </section>
        <section className="side" aria-label="Poster pameran">
          {ex.poster_url ? <img src={ex.poster_url} alt={`Poster ${ex.title}`} style={{ width: '100%', height: 'auto', display: 'block' }} /> : null}
        </section>
      </div>

      {ex.press_release ? (
        <section className="wrap release" aria-labelledby="h-rilis">
          <article className="release-body">
            <p className="eyebrow">Siaran pers</p>
            <h2 id="h-rilis" className="h2 release-title">{ex.press_release_title || ex.title}</h2>
            <p className="small mono release-meta">{[fmtRange(ex.starts_on, ex.ends_on), ex.venue].filter(Boolean).join(' · ')}</p>
            {paragraphs(ex.press_release).map((p, i) => <p key={i} className="release-p">{linkify(p)}</p>)}
          </article>
        </section>
      ) : null}

      {press.length ? (
        <section className="wrap home-block" aria-labelledby="h-liputan" style={{ paddingTop: 0 }}>
          <div className="block-head"><h2 id="h-liputan" className="h2">Liputan media</h2></div>
          <ul className="press-grid" style={{ marginTop: 0 }}>{press.map((r) => <PressCard key={r.id} r={r} />)}</ul>
        </section>
      ) : null}
    </PublicShell>
  );
}
