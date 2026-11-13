import { PublicShell } from '../../components/Shell';
import { ExhibitionCard } from '../../components/Cards';
import { guestbookOpen, listExhibitions } from '../../lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pameran · ARTSYndrome', description: 'Pameran yang digelar bersama ARTSYndrome: sedang berlangsung, akan datang, dan arsip.' };

const GROUPS = [['ongoing', 'Sedang berlangsung'], ['upcoming', 'Akan datang'], ['past', 'Arsip']];

export default async function Exhibitions() {
  const all = await listExhibitions();
  return (
    <PublicShell active="/pameran">
      <div className="wrap page-pad">
        <header className="page-head">
          <p className="eyebrow">ARTSYndrome</p>
          <h1 className="display page-title">Pameran</h1>
          <p className="home-lead">Pameran yang digelar seniman dan komunitas bersama ARTSYndrome.</p>
        </header>
        {all.length === 0 ? <p className="lead" style={{ padding: '40px 0' }}>Agenda pameran akan diumumkan di sini.</p> : null}
        {GROUPS.map(([key, label]) => {
          const rows = all.filter((e) => e.status === key);
          if (!rows.length) return null;
          const sorted = key === 'past' ? rows : [...rows].sort((a, b) => (a.starts_on || '').localeCompare(b.starts_on || ''));
          return (
            <section key={key} className="home-block" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div className="block-head"><h2 className="h2">{label}</h2></div>
              <div className="ex-list">{sorted.map((ex) => <ExhibitionCard key={ex.id} ex={ex} showGuestbook={key !== 'past' && guestbookOpen(ex)} />)}</div>
            </section>
          );
        })}
      </div>
    </PublicShell>
  );
}
