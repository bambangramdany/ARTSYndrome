import { ROLES, SOURCES } from './util';
import { inPeriod, jakartaDate, scopeByPeriod } from './guests';
import { resolvePlace } from './placeSearch';

// Laporan buku tamu: satu ringkasan (jumlah + persen) untuk setiap variabel data.
// Dipakai oleh /admin/laporan (grafik) dan /api/admin/report (Excel/CSV).

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const NONE = 'Tidak diisi';

// Kota: sejak 24 Nov tamu memilih dari saran 514 kabupaten/kota (lib/places.js), tetapi tetap
// boleh mengetik bebas. Isian yang dikenali ditulis dengan nama resmi ("jaksel" dan
// "Jakarta Selatan" -> "Kota Jakarta Selatan"); yang lain hanya dirapikan, tidak ditebak.
export function normalizeCity(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, ' ').replace(/[.,]+$/, '');
  if (!s) return NONE;
  const place = resolvePlace(s);
  if (place?.name) return place.name;
  return s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

const OTHER_PLACE = 'Tidak dikenali (luar negeri / isian bebas)';
export function provinceOf(raw) {
  if (!String(raw || '').trim()) return NONE;
  return resolvePlace(raw)?.province || OTHER_PLACE;
}

const pct = (n, base) => (base ? (n / base) * 100 : 0);

function tally(items, keyFn, { order, top, base } = {}) {
  const counts = new Map();
  for (const it of items) {
    const keys = [].concat(keyFn(it));
    for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1);
  }
  let rows = [...counts.entries()].map(([label, n]) => ({ label, n }));
  if (order) {
    const idx = (l) => { const i = order.indexOf(l); return i === -1 ? order.length : i; };
    // Kategori baku selalu tampil (juga yang 0) supaya laporan antarpameran bisa dibandingkan.
    for (const l of order) if (!counts.has(l)) rows.push({ label: l, n: 0 });
    rows.sort((a, b) => idx(a.label) - idx(b.label) || b.n - a.n);
  } else {
    rows.sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)));
  }
  // "Tidak diisi" dan "Tidak dikenali" selalu di bawah dan tidak dilebur ke "Lainnya".
  const pinned = (r) => r.label === NONE || r.label === OTHER_PLACE;
  if (!order) rows = [...rows.filter((r) => !pinned(r)), ...rows.filter(pinned)];
  if (top && rows.length > top) {
    const keep = rows.filter((r) => !pinned(r)).slice(0, top);
    const rest = rows.filter((r) => !keep.includes(r) && !pinned(r));
    rows = [...keep, ...(rest.length ? [{ label: `Lainnya (${rest.length})`, n: rest.reduce((s, r) => s + r.n, 0) }] : []), ...rows.filter(pinned)];
  }
  const b = base ?? items.length;
  return rows.map((r) => ({ ...r, pct: pct(r.n, b) }));
}

function hourJakarta(ts) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date(ts))) % 24;
}

function fmtDay(d) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(d + 'T00:00:00Z'));
}

// guests: baris tabel guests (sudah disaring per pameran/periode). exById: peta id -> pameran.
export function guestSections(guests, { exById, multi } = {}) {
  const base = guests.length;
  const sections = [];

  if (multi) {
    sections.push({
      key: 'pameran', title: 'Tamu per pameran',
      rows: tally(guests, (g) => exById[g.exhibition_id]?.title || 'Tanpa pameran')
    });
  }
  sections.push({ key: 'jalur', title: 'Jalur masuk', rows: tally(guests, (g) => g.path, { order: ['Walk-in', 'Undangan'] }) });
  sections.push({
    key: 'peran', title: 'Datang sebagai',
    note: 'Satu tamu boleh memilih lebih dari satu, jadi total persen bisa lebih dari 100%.',
    rows: tally(guests, (g) => ((g.roles || []).length ? g.roles : [NONE]), { order: [...ROLES, NONE] })
  });
  sections.push({ key: 'sumber', title: 'Tahu pameran dari', rows: tally(guests, (g) => g.source || NONE, { order: [...SOURCES, NONE] }) });
  sections.push({
    key: 'kota', title: 'Kota asal',
    note: 'Isian yang cocok dengan daftar resmi ditulis dengan nama resmi (Jaksel menjadi Kota Jakarta Selatan). Isian yang menunjuk lebih dari satu wilayah, seperti "Bekasi", dibiarkan apa adanya. 12 teratas.',
    rows: tally(guests, (g) => normalizeCity(g.city), { top: 12 })
  });
  sections.push({
    key: 'provinsi', title: 'Provinsi asal',
    note: 'Dari isian kota. "Bekasi" atau "Jakarta" tetap terhitung provinsinya walau kotanya tidak spesifik.',
    rows: tally(guests, (g) => provinceOf(g.city), { top: 12 })
  });
  sections.push({ key: 'izin', title: 'Bersedia diundang lagi', rows: tally(guests, (g) => (g.consent ? 'Ya' : 'Tidak'), { order: ['Ya', 'Tidak'] }) });
  sections.push({ key: 'instagram', title: 'Mencantumkan Instagram', rows: tally(guests, (g) => (g.instagram ? 'Ya' : 'Tidak'), { order: ['Ya', 'Tidak'] }) });

  const days = [...new Set(guests.map((g) => jakartaDate(g.created_at)))].sort();
  sections.push({
    key: 'tanggal', title: 'Tamu per tanggal',
    rows: tally(guests, (g) => jakartaDate(g.created_at), { order: days }).map((r) => ({ ...r, label: fmtDay(r.label) }))
  });
  sections.push({
    key: 'hari', title: 'Tamu per hari',
    rows: tally(guests, (g) => DAYS[new Date(jakartaDate(g.created_at) + 'T00:00:00Z').getUTCDay()], { order: DAY_ORDER })
  });
  const hours = guests.map((g) => hourJakarta(g.created_at));
  const hMin = hours.length ? Math.min(...hours) : 0;
  const hMax = hours.length ? Math.max(...hours) : -1;
  const hourLabels = [];
  for (let h = hMin; h <= hMax; h++) hourLabels.push(`${String(h).padStart(2, '0')}.00–${String(h).padStart(2, '0')}.59`);
  sections.push({
    key: 'jam', title: 'Jam mengisi (WIB)',
    rows: tally(guests, (g) => { const h = hourJakarta(g.created_at); return `${String(h).padStart(2, '0')}.00–${String(h).padStart(2, '0')}.59`; }, { order: hourLabels })
  });

  return sections.map((s) => ({ ...s, base }));
}

const RSVP_LABEL = { yes: 'Hadir', maybe: 'Belum pasti', no: 'Berhalangan' };

export function invitationSections(invites) {
  if (!invites.length) return [];
  const base = invites.length;
  const yes = invites.filter((i) => i.rsvp === 'yes');
  return [
    { key: 'u-kategori', title: 'Undangan per kategori', rows: tally(invites, (i) => i.category, { order: ['VIP', 'Brand', 'Media'] }) },
    {
      key: 'u-tahap', title: 'Perjalanan undangan',
      note: 'Persen dari seluruh undangan.',
      rows: [
        ['Terkirim', invites.filter((i) => i.sent_at).length],
        ['Dibuka', invites.filter((i) => i.opened_at).length],
        ['Menjawab RSVP', invites.filter((i) => i.rsvp).length],
        ['Check-in di lokasi', invites.filter((i) => i.checked_in_at).length]
      ].map(([label, n]) => ({ label, n, pct: pct(n, base) }))
    },
    { key: 'u-rsvp', title: 'Jawaban RSVP', rows: tally(invites, (i) => RSVP_LABEL[i.rsvp] || 'Belum menjawab', { order: ['Hadir', 'Belum pasti', 'Berhalangan', 'Belum menjawab'] }) },
    {
      key: 'u-hadir', title: 'RSVP hadir yang benar-benar datang',
      note: `Dari ${yes.length} undangan yang menjawab Hadir.`,
      rows: tally(yes, (i) => (i.checked_in_at ? 'Datang (check-in)' : 'Tidak tercatat datang'), { order: ['Datang (check-in)', 'Tidak tercatat datang'] })
    }
  ].map((s) => ({ ...s, base: s.key === 'u-hadir' ? yes.length : base }));
}

// Ringkasan angka utama untuk kotak di atas laporan.
export function headline(guests, exhibitions) {
  const n = guests.length;
  const days = new Set(guests.map((g) => jakartaDate(g.created_at))).size;
  const share = (k) => pct(guests.filter(k).length, n);
  const phones = new Map();
  for (const g of guests) if (g.whatsapp) phones.set(g.whatsapp, new Set([...(phones.get(g.whatsapp) || []), g.exhibition_id]));
  const returning = [...phones.values()].filter((s) => s.size > 1).length;
  return {
    total: n,
    perDay: days ? n / days : 0,
    days,
    walkin: share((g) => g.path === 'Walk-in'),
    consent: share((g) => g.consent),
    newcomers: share((g) => (g.roles || []).includes('Baru mulai mengenal seni')),
    returning,
    exhibitions: exhibitions.length
  };
}

// Pilih pameran + periode lalu ambil data. slug 'semua' = semua pameran.
export async function loadReport(sb, { slug, w, allExhibitions, currentExhibition }) {
  const list = await allExhibitions();
  const active = await currentExhibition();
  const all = slug === 'semua';
  const chosen = all ? list : [list.find((e) => e.slug === slug) || list.find((e) => e.id === active.id) || active];
  const ids = chosen.map((e) => e.id);
  const [{ data: g }, { data: inv }] = await Promise.all([
    sb.from('guests').select('*').in('exhibition_id', ids).order('created_at', { ascending: true }),
    sb.from('invitations').select('id,exhibition_id,category,sent_at,opened_at,rsvp,checked_in_at').in('exhibition_id', ids)
  ]);
  const exById = Object.fromEntries(list.map((e) => [e.id, e]));
  const raw = g || [];
  const guests = chosen.flatMap((e) => scopeByPeriod(raw.filter((x) => x.exhibition_id === e.id), e, w));
  const outside = raw.filter((x) => !inPeriod(x, exById[x.exhibition_id])).length;
  return { list, active, all, chosen, exById, guests, invites: inv || [], outside, rawCount: raw.length };
}

export const fmtPct = (v) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(v) + '%';

export const PERIOD_LABEL = { periode: 'Masa pameran', luar: 'Di luar masa pameran', semua: 'Semua waktu' };

const fmtNum = (v, d = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }).format(v);
function fmtRangeShort(a, b) {
  const f = (d, o) => new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', ...o }).format(new Date(d + 'T00:00:00Z'));
  if (!a) return '';
  if (!b) return 'mulai ' + f(a, { day: 'numeric', month: 'long', year: 'numeric' });
  return f(a, { day: 'numeric', month: 'long' }) + ' – ' + f(b, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Semua yang ditampilkan laporan (halaman, PDF) dari hasil loadReport.
export function reportView(r, w) {
  const one = !r.all ? r.chosen[0] : null;
  const h = headline(r.guests, r.chosen);
  return {
    one,
    scopeTitle: one ? one.title : 'Semua pameran',
    scopeSub: one
      ? [one.artist, one.venue, fmtRangeShort(one.starts_on, one.ends_on)].filter(Boolean).join(' · ')
      : `${r.chosen.length} pameran · ${PERIOD_LABEL[w].toLowerCase()} tiap pameran`,
    periodLabel: PERIOD_LABEL[w],
    tiles: [
      ['Total tamu', fmtNum(h.total)],
      ['Rata-rata per hari', fmtNum(h.perDay, 1), `${fmtNum(h.days)} hari ada tamu`],
      ['Walk-in', fmtPct(h.walkin)],
      ['Bersedia diundang', fmtPct(h.consent)],
      ['Baru mengenal seni', fmtPct(h.newcomers)],
      ...(r.all && r.chosen.length > 1 ? [['Datang ke >1 pameran', fmtNum(h.returning), 'nomor WA yang sama']] : [])
    ],
    footnote: 'Persen dihitung dari jumlah tamu pada pilihan ini (n).' + (w === 'periode' && r.outside ? ` ${fmtNum(r.outside)} isian di luar masa pameran tidak ikut dihitung.` : ''),
    sections: guestSections(r.guests, { exById: r.exById, multi: r.all && r.chosen.length > 1 }),
    inviteSections: w === 'luar' ? [] : invitationSections(r.invites)
  };
}
