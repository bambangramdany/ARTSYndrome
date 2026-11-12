import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { db, siteUrl } from '../../../lib/db';
import { fmtRange } from '../../../lib/util';
import InviteView from '../../../components/InviteView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Undangan · ARTSYndrome', robots: { index: false, follow: false } };

export default async function InvitePage({ params }) {
  const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const sb = db();
  const { data: inv } = await sb.from('invitations').select('*, exhibitions(*)').eq('code', code).maybeSingle();
  if (!inv) notFound();
  if (!inv.opened_at) await sb.from('invitations').update({ opened_at: new Date().toISOString() }).eq('id', inv.id);

  const ex = inv.exhibitions;
  const qrSvg = await QRCode.toString(`${siteUrl()}/c/${inv.code}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#FFFFFF' } });

  const invite = {
    code: inv.code,
    name: inv.name,
    category: inv.category,
    organization: inv.organization,
    maxGuests: inv.max_guests,
    rsvp: inv.rsvp,
    rsvpGuests: inv.rsvp_guests,
    companion: inv.companion,
    jobTitle: inv.job_title,
    coverage: inv.coverage || [],
    wantsPresskit: !!inv.wants_presskit,
    note: inv.note
  };
  const event = {
    title: ex.title,
    artist: ex.artist,
    venue: ex.venue,
    address: ex.address,
    opening: ex.opening_label,
    range: fmtRange(ex.starts_on, ex.ends_on),
    endLabel: ex.ends_on ? fmtRange(ex.ends_on) : '',
    deadline: ex.rsvp_deadline_label,
    contact: ex.contact_label,
    posterUrl: ex.poster_url,
    posterCaption: ex.poster_caption,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([ex.venue, ex.address].filter(Boolean).join(' ')),
    calUrl: `/api/ics/${inv.code}`
  };
  return <InviteView invite={invite} event={event} qrSvg={qrSvg} />;
}
