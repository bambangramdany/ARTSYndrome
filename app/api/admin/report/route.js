import { isAdmin } from '../../../../lib/auth';
import { db, currentExhibition, allExhibitions } from '../../../../lib/db';
import { PERIOD_MODES } from '../../../../lib/guests';
import { loadReport, reportView, PERIOD_LABEL } from '../../../../lib/report';
import { buildReportPdf } from '../../../../lib/reportPdf';
import { buildXlsx } from '../../../../lib/xlsx';

const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

// Laporan dalam format panjang (satu baris per kategori), siap dipivot atau dibuat grafik
// di Excel/Google Sheets: Cakupan, Waktu isi, Kelompok, Variabel, Kategori, Jumlah, Persen, Basis.
export async function GET(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const url = new URL(req.url);
  const w = PERIOD_MODES.includes(url.searchParams.get('w')) ? url.searchParams.get('w') : 'periode';
  const slug = url.searchParams.get('ex') || 'semua';
  const r = await loadReport(db(), { slug, w, allExhibitions, currentExhibition });
  const v = reportView(r, w);
  const scope = v.scopeTitle;
  const file = `laporan-${r.all ? 'semua-pameran' : r.chosen[0].slug}${w !== 'periode' ? '-' + w : ''}`;

  if (url.searchParams.get('format') === 'pdf') {
    const pdf = await buildReportPdf({
      scopeTitle: v.scopeTitle, scopeSub: v.scopeSub, periodLabel: v.periodLabel, tiles: v.tiles, footnote: v.footnote,
      groups: [['Tamu', v.sections], ['Undangan', v.inviteSections, 'Seluruh undangan pada pameran terpilih, tidak disaring waktu isi.']],
      generatedAt: new Date()
    });
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file}.pdf"`,
        'Cache-Control': 'no-store'
      }
    });
  }

  const groups = [['Tamu', v.sections], ['Undangan', v.inviteSections]];
  const rows = [];
  for (const [group, sections] of groups) {
    for (const s of sections) {
      for (const x of s.rows) rows.push([scope, PERIOD_LABEL[w], group, s.title, x.label, x.n, Math.round(x.pct * 10) / 10, s.base]);
    }
  }
  const headers = ['Cakupan', 'Waktu isi', 'Kelompok', 'Variabel', 'Kategori', 'Jumlah', 'Persen', 'Basis (n)'];

  if (url.searchParams.get('format') === 'xlsx') {
    const buf = buildXlsx({ sheetName: 'Laporan', headers, rows, widths: [22, 20, 12, 34, 34, 10, 10, 10] });
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file}.xlsx"`,
        'Cache-Control': 'no-store'
      }
    });
  }
  const lines = [headers.map(csvCell).join(',')].concat(rows.map((row) => row.map(csvCell).join(',')));
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}.csv"`,
      'Cache-Control': 'no-store'
    }
  });
}
