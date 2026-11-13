import { PublicShell } from '../../components/Shell';
import { ArtistCard } from '../../components/Cards';
import { listArtists } from '../../lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seniman · ARTSYndrome', description: 'Seniman visual yang berpameran bersama ARTSYndrome.' };

export default async function Artists() {
  const artists = await listArtists();
  return (
    <PublicShell active="/seniman">
      <div className="wrap page-pad">
        <header className="page-head">
          <p className="eyebrow">ARTSYndrome</p>
          <h1 className="display page-title">Seniman</h1>
          <p className="home-lead">Seniman visual yang berpameran bersama ARTSYndrome. Seniman dan karyanya tetap yang utama.</p>
        </header>
        {artists.length ? <div className="artist-grid" style={{ marginTop: 32 }}>{artists.map((a) => <ArtistCard key={a.id} a={a} />)}</div>
          : <p className="lead" style={{ padding: '40px 0' }}>Profil seniman akan tampil di sini.</p>}
      </div>
    </PublicShell>
  );
}
