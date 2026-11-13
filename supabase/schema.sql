-- ARTSYndrome · struktur database
-- Jalankan sekali di Supabase: SQL Editor › New query › tempel semua › Run.

create extension if not exists pgcrypto;

-- Pameran. Satu baris per pameran; tamu dan undangan selalu menempel ke pameran.
create table if not exists exhibitions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  artist text not null,
  venue text,
  address text,
  opening_label text,          -- contoh: 'Minggu, 15 November 2026, 16.00 WIB'
  opening_at timestamptz,      -- contoh: '2026-11-15 16:00+07' (dipakai untuk "Simpan ke kalender")
  starts_on date,
  ends_on date,
  rsvp_deadline_label text,
  contact_label text,          -- contoh: 'Nama PIC · 08xx'
  poster_url text,             -- tautan foto karya utama (opsional)
  poster_caption text,         -- contoh: 'Franki Indrasmoro, Judul, 2026. Akrilik di kanvas, 100 × 120 cm.'
  instagram text,              -- contoh: '@artsyndrome'
  privacy_contact text,        -- email untuk permintaan hapus data
  created_at timestamptz not null default now()
);

-- Undangan pribadi (VIP, Brand, Media). Tiap undangan punya kode unik untuk tautan.
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  code text unique not null,
  name text not null,
  category text not null check (category in ('VIP', 'Brand', 'Media')),
  organization text,
  whatsapp text,               -- disimpan dalam format 62xxxxxxxxxx
  email text,
  max_guests int not null default 2,
  sent_at timestamptz,
  opened_at timestamptz,
  rsvp text check (rsvp in ('yes', 'maybe', 'no')),
  rsvp_guests int,
  companion text,
  job_title text,
  coverage text[],
  wants_presskit boolean,
  note text,
  rsvp_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invitations_exhibition_idx on invitations(exhibition_id);
create index if not exists invitations_whatsapp_idx on invitations(whatsapp);

-- Tamu yang benar-benar hadir (buku tamu atau check-in undangan).
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  invitation_id uuid references invitations(id) on delete set null,
  path text not null check (path in ('Undangan', 'Walk-in')),
  name text not null,
  email text,
  whatsapp text,
  city text,
  instagram text,
  roles text[],
  source text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guests_exhibition_idx on guests(exhibition_id);
create unique index if not exists guests_invitation_unique on guests(invitation_id) where invitation_id is not null;

-- Keamanan: RLS aktif tanpa policy publik. Hanya server website (service role) yang bisa baca/tulis.
alter table exhibitions enable row level security;
alter table invitations enable row level security;
alter table guests enable row level security;

-- Izin eksplisit untuk server website. Perlu bila project dibuat tanpa
-- "otomatis buka tabel baru ke Data API"; aman dijalankan ulang.
grant usage on schema public to service_role;
grant select, insert, update, delete on exhibitions, invitations, guests to service_role;

-- Pameran pertama. Ganti nilai dalam [KURUNG] lewat Table Editor kapan saja.
insert into exhibitions (slug, title, artist, venue, address, opening_label, starts_on, ends_on, rsvp_deadline_label, contact_label)
values ('si-pemikir', 'Si Pemikir', 'Franki Indrasmoro', 'Galeri TOKONOMA', '[ALAMAT GALERI]',
        'Minggu, 15 November 2026, [JAM] WIB', '2026-11-15', '2026-11-22', '[TANGGAL BATAS RSVP]', '[NAMA PIC] · [08xx]')
on conflict (slug) do nothing;

-- Liputan media: link berita yang ditempel tim di /admin/liputan, tampil di /liputan.
-- Hanya metadata pratinjau (judul, media, tanggal, cuplikan, gambar) yang disimpan; artikel tetap di situs aslinya.
create table if not exists press_links (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  url text not null,
  title text not null,
  outlet text,                 -- nama media, contoh: 'Kompas.com'
  published_on date,
  excerpt text,                -- cuplikan singkat dari deskripsi pratinjau situs
  image_url text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (exhibition_id, url)
);
create index if not exists press_links_exhibition_idx on press_links(exhibition_id);
alter table press_links enable row level security;
grant select, insert, update, delete on press_links to service_role;

-- ── Tahap 1b (13 Nov 2026): ARTSYndrome sebagai wadah banyak seniman ──
-- Seniman yang difasilitasi ARTSYndrome. Profil tampil di /seniman.
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  alias text,                  -- nama panggung / julukan, contoh: 'Pepeng'
  short_bio text,              -- 1–2 kalimat untuk kartu
  bio text,                    -- profil lengkap; paragraf dipisah baris kosong
  photo_url text,
  instagram text,
  website text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table artists enable row level security;
grant select, insert, update, delete on artists to service_role;

-- Pameran terhubung ke seniman utamanya, punya deskripsi, dan bisa disembunyikan.
alter table exhibitions add column if not exists artist_id uuid references artists(id) on delete set null;
alter table exhibitions add column if not exists description text;
alter table exhibitions add column if not exists published boolean not null default true;

-- Permintaan undangan dari publik (/undangan). Tim menindaklanjuti di /admin/permintaan.
create table if not exists invitation_requests (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid references exhibitions(id) on delete set null,   -- null = semua pameran berikutnya
  name text not null,
  email text,
  whatsapp text,               -- format 62xxxxxxxxxx
  organization text,
  roles text[],
  note text,
  consent boolean not null default false,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invitation_requests_created_idx on invitation_requests(created_at desc);
alter table invitation_requests enable row level security;
grant select, insert, update, delete on invitation_requests to service_role;

-- Data awal dari siaran pers "Si Pemikir". Bisa diubah lewat Table Editor kapan saja.
insert into artists (slug, name, alias, short_bio, bio, instagram, sort_order)
values (
  'franki-indrasmoro', 'Franki Indrasmoro', 'Pepeng',
  'Perupa dan musisi, dikenal sebagai Pepeng (eks Naif). Lulusan FSRD Institut Kesenian Jakarta yang mengawali karier sebagai ilustrator majalah HAI.',
  E'Franki Indrasmoro, yang dikenal sebagai Pepeng (eks Naif), menempuh pendidikan di Fakultas Seni Rupa dan Desain Institut Kesenian Jakarta. Jauh sebelum Naif populer, ia sudah berkarya di industri visual: mulai sebagai ilustrator majalah HAI sekitar 1993, lalu lama berkiprah di dunia agensi periklanan sebagai storyboard artist.\n\nIa sudah menggambar sejak belum genap berumur sepuluh tahun, sering kali merespons peristiwa budaya populer di sekitarnya. Pada 2026, di usianya yang genap setengah abad, ia menggelar Si Pemikir, pameran lebih dari 150 karya visual yang merangkum perjalanan berkeseniannya.\n\nSelain seni rupa, Franki menyiapkan babak baru sebagai musisi lewat album penuh berjudul Revisi Diri, yang direncanakan rilis awal 2027.',
  '@franki.indrasmoro', 1
)
on conflict (slug) do nothing;

update exhibitions set
  artist_id = coalesce(artist_id, (select id from artists where slug = 'franki-indrasmoro')),
  description = coalesce(description, E'Si Pemikir menampilkan lebih dari 150 karya visual Franki Indrasmoro, dari gambar masa kecil hingga karya terbarunya. Judul pameran lahir ketika Franki mengumpulkan karya-karya lamanya dan menyadari bahwa dirinya seorang pemikir: suka memikirkan banyak hal secara kritis, sekaligus kreator yang membangun semesta dari fantasinya.\n\nPameran ini mengajak pengunjung ikut berpikir, menemukan dan mengembangkan potensi diri agar berguna bagi sesama dan alam. Pada hari penutupan, Franki memperdengarkan lagu-lagu dari album debutnya, Revisi Diri.')
where slug = 'si-pemikir';

-- ── Tahap 1c (13 Nov 2026): siaran pers lengkap di halaman pameran ──
-- Paragraf dipisah baris kosong. Tampil di /pameran/[slug] di bawah poster.
alter table exhibitions add column if not exists press_release_title text;
alter table exhibitions add column if not exists press_release text;

update exhibitions set
  press_release_title = 'Sebuah pameran karya Franki Indrasmoro a.k.a Pepeng ex Naif bertajuk "Si Pemikir"',
  press_release = $rilis$Lebih tiga dekade dan jauh sebelum Naif populer, Pepeng yang berkuliah Fakultas Seni Rupa & Desain (FSRD) di Institut Kesenian Jakarta ini sudah mengawali karirnya di industri visual. Dimulai sebagai ilustrator majalah HAI circa 1993 dan akhirnya sibuk di lingkar dunia agensi periklanan sebagai storyboard artist.

Banyak karya sudah dia hasilkan, bahkan mundur jauh saat dia belum genap berumur 10 tahun. Karya yang terinspirasi dan merespon peristiwa budaya populer pada saat itu.

Pamerannya dinamakan “Si Pemikir” sejak Franki menyadari bahwa dirinya ternyata adalah seorang pemikir; suka memikirkan banyak hal secara kritis dan seorang kreator, pemimpi yang suka berfantasi dan membangun semesta atas fantasinya tersebut.

Semua ia temukan saat mengumpulkan karya-karya lamanya sejak kecil sampai ia dewasa.

Pameran 150 lebih karya visual ini berusaha menangkap perjalanan Franki berkesenian selama hidupnya sejauh ini di usianya yang genap setengah abad di tahun 2026. Peristiwa bersanding-iringnya seni rupa dan seni bebunyian; bahwa terbukti manusia sebagai makhluk Tuhan menjalankan semua potensinya secara optimal selama ia bisa mengaturnya (waktu, fisik dan mental.)

Si Pemikir ingin mengajak khalayak ramai, terutama para penikmat pameran karyanya, untuk "berpikir" menemukan dan mengembangkan potensi mereka agar menjadi manusia yang berguna bagi manusia lainnya, juga bagi alam. Dikaitkan dengan kondisi Indonesia saat ini, kita masing-masing perlu retrospeksi diri kita untuk menemukan guna kita bagi sesama warga.

Pameran ini dibuka dengan penuh syukur dan suka cita, dan ditutup dengan pintu gerbang babak baru Franki Indrasmoro sebagai seniman musik memperdengarkan tiga belas lagu, yang akan dirilis dalam format album penuh di awal tahun 2027 berjudul “Revisi Diri”, memperlihatkan cover art album tersebut, sekaligus melakukan selebrasi atas perilisan single “Jangan Paksa Kuberhenti Khawatirkanmu” sebagai menu pembuka albumnya.

Pameran ini terselenggara dalam kolaborasi dengan ARTSYndrome, sebuah inisiatif yang mempertemukan seniman visual dan penikmat seni, serta didukung oleh DCDC, wadah bagi para pecinta musik dan seni. Karya-karya komunitasnya bisa dilihat di dcdc.id.

Selamat menikmati karya Franki :)

@franki.indrasmoro · @tokonoma_jkt · @artsyndrome.id$rilis$
where slug = 'si-pemikir';
