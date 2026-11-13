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
