import { db } from '../../../../lib/db';

const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export async function GET(_req, { params }) {
  const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const { data: inv } = await db().from('invitations').select('code, exhibitions(*)').eq('code', code).maybeSingle();
  if (!inv) return new Response('Tidak ditemukan', { status: 404 });
  const ex = inv.exhibitions;

  let timing;
  if (ex.opening_at) {
    const start = new Date(ex.opening_at);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    timing = `DTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}`;
  } else {
    const d = (ex.starts_on || '').replace(/-/g, '');
    const next = new Date(ex.starts_on + 'T00:00:00Z');
    next.setUTCDate(next.getUTCDate() + 1);
    timing = `DTSTART;VALUE=DATE:${d}\r\nDTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`;
  }

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ARTSYndrome//Undangan//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${inv.code}@artsyndrome.id`,
    `DTSTAMP:${stamp(new Date())}`,
    timing,
    `SUMMARY:${esc(`Pembukaan pameran ${ex.title} · ${ex.artist}`)}`,
    `LOCATION:${esc([ex.venue, ex.address].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${esc('ARTSYndrome × ' + ex.artist)}`,
    'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\r\n');

  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="si-pemikir-${inv.code}.ics"` }
  });
}
