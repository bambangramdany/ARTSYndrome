import Link from 'next/link';
import { AdminShell } from '../../../components/Shell';
import InviteActions from '../../../components/InviteActions';
import { requireAdmin } from '../../../lib/auth';
import { db, currentExhibition, siteUrl } from '../../../lib/db';
import { displayPhone, fmtTime } from '../../../lib/util';
import { waMessage, emailMessage } from '../../../lib/messages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Undangan · ARTSYndrome', robots: { index: false, follow: false } };

const TABS = ['Semua', 'VIP', 'Brand', 'Media'];
const RSVP = { yes: 'Hadir', maybe: 'Belum pasti', no: 'Berhalangan' };

export default async function AdminInvites({ searchParams }) {
  requireAdmin('/admin/undangan');
  const ex = await currentExhibition();
  const { data } = await db().from('invitations').select('*').eq('exhibition_id', ex.id).order('created_at', { ascending: true });
  const all = data || [];
  const tab = TABS.includes(searchParams.k) ? searchParams.k : 'Semua';
  const rows = tab === 'Semua' ? all : all.filter((i) => i.category === tab);
  const notice = typeof searchParams.ok === 'string' ? searchParams.ok : '';
  const err = typeof searchParams.err === 'string' ? searchParams.err : '';

  const stats = [
    ['Diundang', all.length],
    ['Terkirim', all.filter((i) => i.sent_at).length],
    ['Dibuka', all.filter((i) => i.opened_at).length],
    ['Hadir (orang)', all.filter((i) => i.rsvp === 'yes').reduce((n, i) => n + (i.rsvp_guests || 1), 0)],
    ['Belum jawab', all.filter((i) => !i.rsvp).length],
    ['Sudah check-in', all.filter((i) => i.checked_in_at).length]
  ];

  return (
    <AdminShell active="/admin/undangan">
      <div className="admin-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow" style={{ fontSize: 12 }}>Undangan pembukaan</p>
          <h1 className="h2" style={{ fontSize: 44, fontWeight: 800 }}>{ex.title}</h1>
          <p className="lead" style={{ fontSize: 15 }}>{[ex.opening_label, ex.venue, ex.rsvp_deadline_label ? 'Batas RSVP ' + ex.rsvp_deadline_label : null].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      {notice ? <p className="small" role="status" style={{ marginTop: 20, padding: '12px 16px', border: '1px solid #111', color: '#111' }}>{notice}</p> : null}
      {err ? <p className="error" role="alert" style={{ marginTop: 20 }}>{err}</p> : null}

      <div className="tiles">
        {stats.map(([label, n]) => <div key={label}><span>{label}</span><strong>{n}</strong></div>)}
      </div>

      <div className="toolbar" role="tablist" aria-label="Kategori undangan">
        {TABS.map((t) => (
          <Link key={t} role="tab" className="pill" aria-selected={t === tab} aria-current={t === tab ? 'true' : undefined} href={t === 'Semua' ? '/admin/undangan' : '/admin/undangan?k=' + t}>{t}</Link>
        ))}
      </div>

      <div className="tablebox">
        <table style={{ minWidth: 1240 }}>
          <thead>
            <tr><th>Nama</th><th>Kategori</th><th>Instansi / media</th><th>Kontak</th><th>Undangan</th><th>RSVP</th><th>Check-in</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="empty">Belum ada undangan. Tambahkan lewat formulir di bawah.</td></tr>
            ) : rows.map((i) => {
              const link = `${siteUrl()}/u/${i.code}`;
              const waUrl = i.whatsapp ? `https://wa.me/${i.whatsapp}?text=${encodeURIComponent(waMessage(i, ex, link))}` : null;
              const m = emailMessage(i, ex, link);
              const mailUrl = i.email ? `mailto:${i.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}` : null;
              const inv = i.opened_at ? 'Dibuka' : i.sent_at ? 'Terkirim' : 'Belum dikirim';
              const extra = i.rsvp === 'yes'
                ? [`${i.rsvp_guests || 1} org`, i.companion ? `+ ${i.companion}` : null, i.job_title, (i.coverage || []).length ? 'Liputan: ' + i.coverage.join(', ') : null, i.wants_presskit ? 'Minta press kit' : null, i.note ? `"${i.note}"` : null].filter(Boolean)
                : [];
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.name}<br /><span className="mono" style={{ color: '#555', fontWeight: 400 }}>{i.code}</span></td>
                  <td><span className={i.category === 'VIP' ? 't-accent' : i.category === 'Media' ? 't-solid' : 't-line'}>{i.category}</span></td>
                  <td>{i.organization || '—'}</td>
                  <td style={{ fontSize: 14 }}>{i.whatsapp ? <span className="mono">{displayPhone(i.whatsapp)}</span> : null}{i.whatsapp && i.email ? <br /> : null}{i.email || (!i.whatsapp ? '—' : null)}</td>
                  <td style={{ fontSize: 14 }}>{inv}{i.sent_at ? <><br /><span className="mono" style={{ color: '#555' }}>{fmtTime(i.opened_at || i.sent_at)}</span></> : null}</td>
                  <td>
                    <span className={i.rsvp === 'yes' ? 't-solid' : 't-line'}>{RSVP[i.rsvp] || 'Belum jawab'}</span>
                    {extra.length ? <div style={{ fontSize: 13, color: '#444', marginTop: 6, lineHeight: 1.5 }}>{extra.join(' · ')}</div> : null}
                  </td>
                  <td className="mono" style={{ color: '#444' }}>{i.checked_in_at ? fmtTime(i.checked_in_at) : '—'}</td>
                  <td><InviteActions id={i.id} link={link} waUrl={waUrl} mailUrl={mailUrl} name={i.name} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: 12 }}>"Kirim WA" membuka WhatsApp dengan pesan yang sudah terisi; tekan kirim di WhatsApp. Statusnya otomatis berubah jadi Terkirim, lalu Dibuka saat tamu membuka tautan.</p>

      <div className="grid2">
        <form className="box" method="post" action="/api/admin/invites">
          <input type="hidden" name="mode" value="single" />
          <h2 className="h2" style={{ fontSize: 24 }}>Tambah tamu undangan</h2>
          <div className="field"><label htmlFor="i-name">Nama <span className="req">(wajib)</span></label><input id="i-name" name="name" className="input" required maxLength={120} /></div>
          <div className="row2">
            <div className="field">
              <label htmlFor="i-cat">Kategori</label>
              <select id="i-cat" name="category" className="input" defaultValue="VIP"><option>VIP</option><option>Brand</option><option>Media</option></select>
            </div>
            <div className="field">
              <label htmlFor="i-max">Maks. orang (termasuk tamu)</label>
              <input id="i-max" name="max_guests" type="number" min="1" max="10" defaultValue="2" className="input" />
            </div>
          </div>
          <div className="field"><label htmlFor="i-org">Instansi / brand / media</label><input id="i-org" name="organization" className="input" maxLength={120} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="i-wa">No. WhatsApp</label><input id="i-wa" name="whatsapp" type="tel" className="input" placeholder="08xx" maxLength={20} /></div>
            <div className="field"><label htmlFor="i-email">Email</label><input id="i-email" name="email" type="email" className="input" maxLength={160} /></div>
          </div>
          <button type="submit" className="btn" style={{ height: 52, fontSize: 16 }}>Simpan undangan</button>
        </form>

        <form className="box" method="post" action="/api/admin/invites">
          <input type="hidden" name="mode" value="bulk" />
          <h2 className="h2" style={{ fontSize: 24 }}>Tambah banyak sekaligus</h2>
          <p className="lead" style={{ fontSize: 14 }}>Satu tamu per baris, pisahkan dengan titik koma. Bisa juga salin langsung dari kolom Google Sheets/Excel.</p>
          <p className="mono" style={{ margin: 0, fontSize: 12, color: '#444', lineHeight: 1.6 }}>Nama; Kategori; Instansi; WhatsApp; Email; Maks<br />Contoh: Rina Putri; Media; Majalah Seni; 0812xxxx; rina@contoh.com; 2</p>
          <div className="field">
            <label htmlFor="i-bulk">Daftar tamu</label>
            <textarea id="i-bulk" name="bulk" className="input" rows={8} />
          </div>
          <button type="submit" className="btn-dark" style={{ alignSelf: 'flex-start' }}>Impor daftar</button>
        </form>
      </div>
    </AdminShell>
  );
}
