import Link from 'next/link';
import PressImage from './PressImage';
import { decodeAll } from '../lib/press';
import { fmtDate, fmtRange } from '../lib/util';
import { STATUS_LABEL } from '../lib/catalog';

export function artistName(ex) {
  return ex.artistRow?.name || ex.artist;
}

export function ExhibitionCard({ ex, showGuestbook = false }) {
  return (
    <article className="ex-card">
      {ex.poster_url ? (
        <Link href={`/pameran/${ex.slug}`} className="ex-card-img" tabIndex={-1} aria-hidden="true">
          <img src={ex.poster_url} alt="" loading="lazy" />
        </Link>
      ) : null}
      <div className="ex-card-body">
        <span className={ex.status === 'ongoing' ? 't-accent' : ex.status === 'upcoming' ? 't-solid' : 't-line'} style={{ alignSelf: 'flex-start' }}>{STATUS_LABEL[ex.status]}</span>
        <h3 className="ex-card-title"><Link href={`/pameran/${ex.slug}`}>{ex.title}</Link></h3>
        <p className="ex-card-artist">{artistName(ex)}</p>
        <p className="small mono" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>{[fmtRange(ex.starts_on, ex.ends_on), ex.venue].filter(Boolean).join(' · ')}</p>
        <div className="ex-card-actions">
          {showGuestbook ? <Link className="btn" href={`/pameran/${ex.slug}/buku-tamu`} style={{ height: 52, fontSize: 16 }}>Isi buku tamu</Link> : null}
          <Link className="btn-line" href={`/pameran/${ex.slug}`}>Lihat pameran</Link>
        </div>
      </div>
    </article>
  );
}

export function PressCard({ r, showExhibition = false }) {
  const title = decodeAll(r.title); const outlet = decodeAll(r.outlet); const excerpt = decodeAll(r.excerpt);
  return (
    <li className="press-card">
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="press-link">
        <div className="press-img"><PressImage src={r.image_url} alt="" /></div>
        <div className="press-body">
          <p className="eyebrow" style={{ fontSize: 12 }}>{[outlet, fmtDate(r.published_on)].filter(Boolean).join(' · ')}</p>
          <h3 className="press-title">{title}</h3>
          {excerpt ? <p className="press-excerpt">{excerpt}</p> : null}
          {showExhibition && r.exhibitions?.title ? <p className="small">Pameran: {r.exhibitions.title}</p> : null}
          <span className="press-more">Baca di {outlet || 'situs media'} <span aria-hidden="true">↗</span></span>
        </div>
      </a>
    </li>
  );
}

export function ArtistCard({ a }) {
  return (
    <article className="artist-card">
      <Link href={`/seniman/${a.slug}`} className="artist-card-link">
        <div className="artist-photo">
          {a.photo_url ? <img src={a.photo_url} alt="" loading="lazy" /> : <span aria-hidden="true">{a.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3 className="artist-card-name">{a.name}</h3>
          {a.alias ? <p className="small mono" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>{a.alias}</p> : null}
          {a.short_bio ? <p className="press-excerpt">{a.short_bio}</p> : null}
        </div>
      </Link>
    </article>
  );
}
