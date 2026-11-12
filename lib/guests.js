export const GUEST_FILTERS = ['Semua', 'Undangan', 'Walk-in', 'Seniman', 'Penikmat seni', 'Baru mulai mengenal seni', 'Media / jurnalis', 'Izin undangan'];

export function filterGuests(rows, f, q) {
  let out = rows;
  if (f === 'Undangan' || f === 'Walk-in') out = out.filter((g) => g.path === f);
  else if (f === 'Izin undangan') out = out.filter((g) => g.consent);
  else if (f && f !== 'Semua') out = out.filter((g) => (g.roles || []).includes(f));
  if (q) {
    const s = q.toLowerCase();
    out = out.filter((g) => [g.name, g.email, g.city, g.instagram, g.whatsapp].some((v) => v && String(v).toLowerCase().includes(s)));
  }
  return out;
}
