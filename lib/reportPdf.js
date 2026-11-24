import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fmtPct } from './report';

// PDF laporan buku tamu (A4 tegak). Logo ARTSYndrome di header setiap halaman dan sebagai
// watermark tipis di footer, bersama nomor halaman. Isinya hanya angka agregat, tanpa data pribadi.
// Font: Archivo + IBM Plex Mono (OFL, lib/pdf-assets). Logo: lib/pdf-assets/logo-black.png
// (render dari public/logo-black.svg, rasio ±2,23:1).

const ASSETS = path.join(process.cwd(), 'lib', 'pdf-assets');
const asset = (f) => fs.readFileSync(path.join(ASSETS, f));

const INK = '#111111';
const MUTED = '#555555';
const LINE = '#DADAD6';
const PAGE = { w: 595.28, h: 841.89 };
const M = { l: 48, r: 48, top: 92, bottom: 76 };
const W = PAGE.w - M.l - M.r;
const LOGO_RATIO = 1200 / 539;
const num = (v, d = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }).format(v);

export function buildReportPdf({ scopeTitle, scopeSub, periodLabel, tiles, footnote, groups, generatedAt }) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: M.top, bottom: M.bottom, left: M.l, right: M.r }, bufferPages: true, info: { Title: `Laporan buku tamu · ${scopeTitle}`, Author: 'ARTSYndrome', Creator: 'artsyndrome.id' } });
  doc.registerFont('sans', asset('archivo-latin-400-normal.ttf'));
  doc.registerFont('bold', asset('archivo-latin-700-normal.ttf'));
  doc.registerFont('mono', asset('ibm-plex-mono-latin-400-normal.ttf'));
  // Dibuka sekali supaya gambar logo hanya disematkan satu kali walau dipakai di tiap halaman.
  const logo = doc.openImage(asset('logo-black.png'));

  // Font memakai subset Latin. Huruf di luar subset (mis. dari isian kota luar negeri)
  // diganti huruf dasarnya supaya tidak tampil sebagai kotak kosong.
  const safe = (t) => {
    const f = doc._font && doc._font.font;
    if (!f || typeof f.hasGlyphForCodePoint !== 'function') return String(t);
    return [...String(t)].map((ch) => {
      if (f.hasGlyphForCodePoint(ch.codePointAt(0))) return ch;
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return base && f.hasGlyphForCodePoint(base.codePointAt(0)) ? base : '?';
    }).join('');
  };
  const text = (font, size, color, str, x, y, opts = {}) => {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(safe(str), x, y, { lineBreak: opts.width ? true : false, ...opts });
  };
  const heightOf = (font, size, str, width) => { doc.font(font).fontSize(size); return doc.heightOfString(safe(str), { width }); };

  let y = M.top;
  const bottom = PAGE.h - M.bottom;
  const newPage = () => { doc.addPage(); y = M.top; };
  const ensure = (h) => { if (y + h > bottom) newPage(); };

  // ── Judul ──
  text('mono', 8, MUTED, `LAPORAN BUKU TAMU · ${periodLabel.toUpperCase()}`, M.l, y, { characterSpacing: 0.6 });
  y += 16;
  text('bold', 26, INK, scopeTitle, M.l, y, { width: W });
  y += heightOf('bold', 26, scopeTitle, W) + 4;
  text('sans', 10.5, MUTED, scopeSub, M.l, y, { width: W });
  y += heightOf('sans', 10.5, scopeSub, W) + 18;

  // ── Kotak angka utama (3 per baris) ──
  const cols = 3;
  const tw = W / cols;
  const th = 58;
  tiles.forEach(([label, value, sub], i) => {
    const cx = M.l + (i % cols) * tw;
    const cy = y + Math.floor(i / cols) * th;
    doc.lineWidth(0.75).strokeColor(INK).rect(cx, cy, tw, th).stroke();
    text('mono', 6.8, MUTED, label.toUpperCase(), cx + 10, cy + 9, { characterSpacing: 0.5, width: tw - 20 });
    text('bold', 19, INK, value, cx + 10, cy + 21);
    if (sub) text('mono', 6.8, MUTED, sub, cx + 10, cy + 44, { width: tw - 20 });
  });
  y += Math.ceil(tiles.length / cols) * th + 10;
  if (footnote) {
    text('sans', 8.5, MUTED, footnote, M.l, y, { width: W });
    y += heightOf('sans', 8.5, footnote, W) + 6;
  }

  // ── Grafik per variabel ──
  const labelW = 168;
  const nW = 40;
  const pW = 48;
  const trackX = M.l + labelW + 8;
  const trackW = W - labelW - 8 - nW - pW - 12;
  const rowPad = 5;

  const sectionHeight = (s) => {
    let h = 22;
    if (s.note) h += heightOf('sans', 8, s.note, W) + 6;
    if (!s.base) return h + 16;
    for (const r of s.rows) h += Math.max(15, heightOf('sans', 9, r.label, labelW) + rowPad * 2 - 2);
    return h + 14;
  };

  for (const [groupTitle, sections, groupNote] of groups) {
    if (!sections.length) continue;
    ensure(40 + sectionHeight(sections[0]));
    y += 8;
    text('bold', 16, INK, groupTitle, M.l, y);
    y += 22;
    if (groupNote) { text('sans', 8, MUTED, groupNote, M.l, y, { width: W }); y += heightOf('sans', 8, groupNote, W) + 8; }

    for (const s of sections) {
      ensure(sectionHeight(s));
      doc.lineWidth(0.75).strokeColor(INK).moveTo(M.l, y).lineTo(M.l + W, y).stroke();
      y += 7;
      text('bold', 11, INK, s.title, M.l, y);
      text('mono', 7.5, MUTED, `n = ${num(s.base)}`, M.l, y + 2, { width: W, align: 'right' });
      y += 17;
      if (s.note) { text('sans', 8, MUTED, s.note, M.l, y, { width: W }); y += heightOf('sans', 8, s.note, W) + 6; }
      if (!s.base) { text('sans', 9, MUTED, 'Belum ada data.', M.l, y); y += 16; continue; }
      const max = Math.max(1, ...s.rows.map((r) => r.pct));
      s.rows.forEach((r, i) => {
        const lh = heightOf('sans', 9, r.label, labelW);
        const rh = Math.max(15, lh + rowPad * 2 - 2);
        if (i > 0) doc.lineWidth(0.4).strokeColor(LINE).moveTo(M.l, y).lineTo(M.l + W, y).stroke();
        const mid = y + rh / 2;
        text('sans', 9, INK, r.label, M.l, mid - lh / 2 + 0.5, { width: labelW });
        const bw = r.n ? Math.max(1.5, (r.pct / max) * trackW) : 0;
        if (bw) doc.fillColor(INK).roundedRect(trackX, mid - 4, bw, 8, Math.min(2, bw / 2)).fill();
        text('mono', 8.5, INK, num(r.n), trackX + trackW + 4, mid - 4.5, { width: nW, align: 'right' });
        text('mono', 8.5, MUTED, fmtPct(r.pct), trackX + trackW + 4 + nW, mid - 4.5, { width: pW + 8, align: 'right' });
        y += rh;
      });
      y += 14;
    }
  }

  // ── Header & footer di setiap halaman ──
  const range = doc.bufferedPageRange();
  const stamp = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(generatedAt);
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const keepBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // supaya teks footer tidak memicu halaman baru

    // Header: logo + judul ringkas
    const hh = 26;
    doc.image(logo, M.l, 30, { height: hh, width: hh * LOGO_RATIO });
    text('mono', 7, MUTED, 'LAPORAN BUKU TAMU', M.l, 34, { width: W, align: 'right', characterSpacing: 0.5 });
    text('mono', 7, INK, scopeTitle.toUpperCase() + ' · ' + periodLabel.toUpperCase(), M.l, 45, { width: W, align: 'right', characterSpacing: 0.5 });
    doc.lineWidth(0.75).strokeColor(INK).moveTo(M.l, 66).lineTo(M.l + W, 66).stroke();

    // Footer: watermark logo tipis + keterangan + nomor halaman
    const fy = PAGE.h - 52;
    doc.lineWidth(0.4).strokeColor(LINE).moveTo(M.l, fy).lineTo(M.l + W, fy).stroke();
    doc.save();
    doc.opacity(0.22);
    doc.image(logo, M.l, fy + 9, { height: 18, width: 18 * LOGO_RATIO });
    doc.restore();
    text('mono', 7, MUTED, `artsyndrome.id · Dibuat ${stamp} WIB · Dokumen internal`, M.l + 18 * LOGO_RATIO + 10, fy + 15);
    text('mono', 7, MUTED, `Halaman ${i - range.start + 1} dari ${range.count}`, M.l, fy + 15, { width: W, align: 'right' });

    doc.page.margins.bottom = keepBottom;
  }

  const done = new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  doc.end();
  return done;
}
