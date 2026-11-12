export function waMessage(inv, ex, link) {
  const greet = inv.category === 'Media' ? `Yth. ${inv.name}${inv.organization ? ', ' + inv.organization : ''}` : `Halo ${inv.name},`;
  return [
    greet,
    '',
    `ARTSYndrome dan ${ex.artist} dengan senang hati mengundang Anda ke pembukaan pameran ${ex.title}.`,
    '',
    ex.opening_label || '',
    [ex.venue, ex.address].filter(Boolean).join(', '),
    '',
    'Mohon konfirmasi kehadiran lewat tautan pribadi berikut:',
    link,
    '',
    'Terima kasih,',
    'ARTSYndrome'
  ].join('\n').replace(/\n{3,}/g, '\n\n');
}

export function emailMessage(inv, ex, link) {
  const subject = inv.category === 'Media'
    ? `Undangan liputan pembukaan pameran ${ex.title}, ${ex.artist}`
    : `Undangan pembukaan pameran ${ex.title}, ${ex.artist}`;
  const body = [
    `Yth. ${inv.name}${inv.organization ? ', ' + inv.organization : ''}`,
    '',
    inv.category === 'Media'
      ? `Kami mengundang rekan media untuk meliput pembukaan pameran ${ex.title} karya ${ex.artist}, hasil kolaborasi pertama ARTSYndrome.`
      : `ARTSYndrome dan ${ex.artist} dengan senang hati mengundang Anda ke pembukaan pameran ${ex.title}.`,
    '',
    [ex.opening_label, ex.venue].filter(Boolean).join(', ') + '.',
    '',
    inv.category === 'Media'
      ? `Konfirmasi kehadiran dan kebutuhan liputan (termasuk permintaan wawancara seniman) dapat diisi di: ${link}`
      : `Mohon konfirmasi kehadiran di: ${link}`,
    '',
    'Salam,',
    ex.contact_label ? `${ex.contact_label}\nARTSYndrome` : 'ARTSYndrome'
  ].join('\n');
  return { subject, body };
}
