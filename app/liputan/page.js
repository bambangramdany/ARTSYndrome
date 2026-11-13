import { PublicShell } from '../../components/Shell';
import { PressCard } from '../../components/Cards';
import { listPress } from '../../lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Liputan media · ARTSYndrome', description: 'Liputan media tentang pameran dan seniman ARTSYndrome.' };

export default async function PressPage() {
  const rows = await listPress();
  return (
    <PublicShell active="/liputan">
      <div className="wrap page-pad">
        <header className="page-head">
          <p className="eyebrow">ARTSYndrome</p>
          <h1 className="display page-title">Liputan media</h1>
          <p className="home-lead">Pameran dan seniman ARTSYndrome di media.</p>
        </header>
        {rows.length === 0 ? <p className="lead press-empty">Liputan media akan tampil di sini.</p>
          : <ul className="press-grid" aria-label="Daftar liputan">{rows.map((r) => <PressCard key={r.id} r={r} showExhibition />)}</ul>}
        <p className="small" style={{ marginTop: 40 }}>Artikel adalah milik masing-masing media dan dibuka di situs aslinya.</p>
      </div>
    </PublicShell>
  );
}
