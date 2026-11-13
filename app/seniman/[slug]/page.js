import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '../../../components/Shell';
import { ExhibitionCard } from '../../../components/Cards';
import { getArtist, guestbookOpen, listExhibitions, paragraphs } from '../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const a = await getArtist(params.slug);
  if (!a) return { title: 'Seniman · ARTSYndrome' };
  return { title: `${a.name} · Seniman · ARTSYndrome`, description: a.short_bio || undefined };
}

export default async function Artist({ params }) {
  const a = await getArtist(params.slug);
  if (!a) notFound();
  const exhibitions = (await listExhibitions()).filter((e) => e.artist_id === a.id);
  const ig = a.instagram ? a.instagram.replace(/^@/, '') : null;

  return (
    <PublicShell active="/seniman">
      <div className="wrap page-pad">
        <div className="artist-profile">
          <div className="artist-photo artist-photo-lg">
            {a.photo_url ? <img src={a.photo_url} alt={`Foto ${a.name}`} /> : <span aria-hidden="true">{a.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <p className="eyebrow"><Link href="/seniman">Seniman</Link></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h1 className="display page-title">{a.name}</h1>
              {a.alias ? <p className="artist">{a.alias}</p> : null}
            </div>
            {paragraphs(a.bio || a.short_bio).map((p, i) => <p key={i} className="about-p">{p}</p>)}
            <div className="ex-card-actions">
              {ig ? <a className="btn-line" href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">Instagram @{ig}</a> : null}
              {a.website ? <a className="btn-line" href={a.website} target="_blank" rel="noopener noreferrer">Situs web</a> : null}
            </div>
          </div>
        </div>
        {exhibitions.length ? (
          <section className="home-block" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div className="block-head"><h2 className="h2">Pameran bersama ARTSYndrome</h2></div>
            <div className="ex-list">{exhibitions.map((ex) => <ExhibitionCard key={ex.id} ex={ex} showGuestbook={ex.status !== 'past' && guestbookOpen(ex)} />)}</div>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
