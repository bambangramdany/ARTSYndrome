import dns from 'dns/promises';
import net from 'net';

// Ambil metadata pratinjau (Open Graph) dari link berita. Hanya dipanggil dari route admin.
// Yang disimpan hanya judul, nama media, tanggal, cuplikan singkat, dan gambar sampul;
// isi artikel tetap di situs aslinya.

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 9000;
const UA = 'Mozilla/5.0 (compatible; ARTSYndromeBot/1.0; +https://artsyndrome.id/liputan)';

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:127.') || v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.');
}

// Tolak alamat lokal/internal supaya fitur ini tidak bisa dipakai untuk mengintip jaringan server.
async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('Link tidak valid.'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Link harus diawali http:// atau https://');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Link tidak valid.');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => { throw new Error('Situs tidak ditemukan. Periksa linknya.'); });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('Link tidak valid.');
  return u;
}

async function fetchHtml(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop < 5; hop++) {
    const u = await assertPublicUrl(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(u, { redirect: 'manual', signal: ctrl.signal, cache: 'no-store', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'id,en;q=0.8' } });
    } catch {
      clearTimeout(timer);
      throw new Error('Situs tidak merespons.');
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      clearTimeout(timer);
      url = new URL(res.headers.get('location'), u).toString();
      continue;
    }
    if (!res.ok) { clearTimeout(timer); throw new Error(`Situs menolak diakses (kode ${res.status}).`); }
    const reader = res.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); size += value.length;
        // Metadata ada di <head>; berhenti setelah </head> supaya hemat.
        if (Buffer.concat(chunks).toString('utf8').includes('</head>')) break;
      }
    } finally { clearTimeout(timer); reader.cancel().catch(() => {}); }
    return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: u.toString() };
  }
  throw new Error('Terlalu banyak pengalihan.');
}

function decodeOnce(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

// Sebagian situs menyandikan dua kali (contoh: "&amp;#039;"); urai sampai tidak berubah lagi.
function decodeAll(s) {
  let prev = s;
  for (let i = 0; i < 3; i++) { const next = decodeOnce(prev); if (next === prev) break; prev = next; }
  return prev;
}

function metaTags(html) {
  const out = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const val = (tag.match(/\bcontent\s*=\s*"([^"]*)"/i) || tag.match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1];
    if (key && val && !out[key.toLowerCase()]) out[key.toLowerCase()] = decodeAll(val);
  }
  return out;
}

export function toDateOnly(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
}

export function shorten(s, max = 240) {
  if (!s) return null;
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export function outletFromUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; }
}

export async function fetchPressMeta(url) {
  const { html, finalUrl } = await fetchHtml(url);
  const m = metaTags(html);
  const titleTag = decodeAll((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const ld = (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1];
  let image = m['og:image:secure_url'] || m['og:image'] || m['twitter:image'] || m['twitter:image:src'] || null;
  if (image) { try { image = new URL(image, finalUrl).toString(); } catch { image = null; } }
  if (image && !/^https?:/i.test(image)) image = null;
  return {
    title: m['og:title'] || m['twitter:title'] || titleTag || null,
    outlet: m['og:site_name'] || m['application-name'] || outletFromUrl(finalUrl),
    published_on: toDateOnly(m['article:published_time'] || m['og:published_time'] || m['datepublished'] || m['pubdate'] || m['publishdate'] || m['date'] || ld),
    excerpt: shorten(m['og:description'] || m['twitter:description'] || m['description'] || null),
    image_url: image
  };
}
