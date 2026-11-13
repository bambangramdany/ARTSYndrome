import { PublicShell } from '../../components/Shell';
import { ExhibitionCard } from '../../components/Cards';
import RequestForm from '../../components/RequestForm';
import { guestbookOpen, listExhibitions } from '../../lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Minta undangan · ARTSYndrome', description: 'Agenda pameran ARTSYndrome yang akan datang dan permintaan undangan.' };

export default async function RequestInvite({ searchParams }) {
  const agenda = (await listExhibitions()).filter((e) => e.status !== 'past').sort((a, b) => (a.starts_on || '').localeCompare(b.starts_on || ''));
  const pre = typeof searchParams.pameran === 'string' && agenda.some((e) => e.slug === searchParams.pameran) ? searchParams.pameran : '';
  return (
    <PublicShell active="/undangan">
      <div className="wrap split">
        <section className="info">
          <p className="eyebrow">Agenda</p>
          <h1 className="display page-title">Minta undangan</h1>
          <p className="home-lead">Ingin datang ke pembukaan pameran ARTSYndrome? Tinggalkan kontak, tim kami akan mengirim undangan bila tempat tersedia, dan mengabari agenda berikutnya.</p>
          {agenda.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 className="h2" style={{ fontSize: 24 }}>Pameran yang akan datang</h2>
              <div className="ex-list ex-list-1">{agenda.map((ex) => <ExhibitionCard key={ex.id} ex={ex} showGuestbook={guestbookOpen(ex)} />)}</div>
            </div>
          ) : <p className="lead">Agenda pameran berikutnya sedang disiapkan. Daftarkan diri untuk dikabari lebih dulu.</p>}
        </section>
        <section className="side" aria-label="Form minta undangan">
          <RequestForm agenda={agenda.map((e) => ({ slug: e.slug, title: e.title, artist: e.artistRow?.name || e.artist }))} preselect={pre} />
        </section>
      </div>
    </PublicShell>
  );
}
