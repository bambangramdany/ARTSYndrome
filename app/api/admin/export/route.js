import { isAdmin } from '../../../../lib/auth';
import { db, currentExhibition } from '../../../../lib/db';
import { displayPhone, fmtTime } from '../../../../lib/util';
import { GUEST_FILTERS, filterGuests } from '../../../../lib/guests';

// Prefix formula-like cells so Excel/Sheets never execute them.
const cell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  // A plain Instagram handle (@name.with_dots) can't be a formula; leave it readable.
  if (/^[=+\-@]/.test(s) && !/^@[A-Za-z0-9._]{1,30}$/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export async function GET(req) {
  if (!isAdmin()) return new Response('Unauthorized', { status: 401 });
  const url = new URL(req.url);
  const f = GUEST_FILTERS.includes(url.searchParams.get('f')) ? url.searchParams.get('f') : 'Semua';
  const q = (url.searchParams.get('q') || '').slice(0, 80);
  const ex = await currentExhibition();
  const { data } = await db().from('guests').select('*').eq('exhibition_id', ex.id).order('created_at', { ascending: true });
  const rows = filterGuests(data || [], f, q);

  const head = ['Waktu', 'Nama', 'Jalur', 'Datang sebagai', 'Kota', 'Email', 'WhatsApp', 'Instagram', 'Sumber', 'Izin undangan'];
  const lines = [head.map(cell).join(',')].concat(rows.map((g) => [
    fmtTime(g.created_at), g.name, g.path, (g.roles || []).join('; '), g.city, g.email, displayPhone(g.whatsapp), g.instagram, g.source, g.consent ? 'Ya' : 'Tidak'
  ].map(cell).join(',')));

  // BOM so Excel reads UTF-8 correctly.
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tamu-${ex.slug}.csv"`
    }
  });
}
