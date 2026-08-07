# 🧊 COLDSTART.md — Streak App
> File ini berisi semua informasi yang dibutuhkan agar siapapun (atau AI) bisa langsung memahami dan melanjutkan project ini tanpa perlu bertanya dari nol.

**Last Updated:** 07 Agustus 2026  
**Penulis:** Tim Intern SF Group (Michael, Daniel, dll.)

---

## 💡 Ide Awal & Latar Belakang

Proyek ini lahir dari pertanyaan: *"Gimana caranya biar mahasiswa bisa tetap produktif selama libur panjang tanpa ngerasa terpaksa?"*

Inspirasinya dari sistem streak TikTok — sederhana, visual, dan bikin ketagihan. Bukan to-do list biasa, tapi **quest tracker bergaya game** dengan sistem "Bara" (bara api 🔥) sebagai motivator konsistensi harian.

**Target pengguna:** Mahasiswa yang lagi libur kuliah (2–4 bulan), biar nggak nganggur dan punya struktur harian yang fun.

---

## 📋 PRD (Product Requirement Document)

Dokumen lengkap ada di [`PRD_Streak_App_v1.2.md`](./PRD_Streak_App_v1.2.md)

### Ringkasan Fitur MVP:

| # | Fitur | Status |
|---|---|---|
| 1 | 🔥 Sistem Bara (Streak Counter, muncul setelah 3 hari aktif) | ✅ Done |
| 2 | 🛡️ Grace Period 48 jam + Restore (+20 XP bonus) | ✅ Done |
| 3 | 📋 Reusable Quest (template tetap, bisa diceklis tiap hari) | ✅ Done |
| 4 | ⚡ XP System (+10/quest, +50 bonus hari ke-7, akumulatif selamanya) | ✅ Done |
| 5 | 🏆 Achievement Badges (Week Warrior, Fortnight Fighter, Monthly Master, dll.) | ✅ Done |
| 6 | 👥 Social + Dual Leaderboard (Global Top 10 & Friends) | ✅ Done |
| 7 | 🔒 Auth: Email/Password + Google OAuth via Better Auth | ✅ Done |
| 8 | 👤 Onboarding (username unik, pilih kategori favorit) | ✅ Done |

### Quest Categories:
`Coding` | `Exercise` | `Learning` | `Hobby` | `Social` | `Chore` | `Custom`

### XP Rules:
- +10 XP per quest completion
- +20 XP restore Bara setelah grace period
- +50 XP milestone hari ke-7 streak
- Total XP **tidak pernah direset** (akumulatif selamanya)

---

## 🛠️ Tech Stack

### Frontend
| Tool | Versi | Fungsi |
|---|---|---|
| React | ^19.2.7 | UI Framework |
| TypeScript | ~6.0.2 | Type safety |
| Vite | ^8.1.1 | Build tool & dev server |
| Vanilla CSS | — | Styling (Glassmorphism, micro-animations, dark mode) |
| React Router DOM | ^7.18.1 | Client-side routing |
| Lucide React | ^1.27.0 | Icon library |
| Zod | ^4.4.3 | Client-side validation (via server schemas) |

### Backend
| Tool | Versi | Fungsi |
|---|---|---|
| Hono | ^4.12.32 | API server framework (ringan, edge-ready) |
| `@hono/node-server` | ^2.0.12 | Node.js adapter untuk Hono |
| Better Auth | ^1.6.25 | Authentication (Credentials + Google OAuth) |
| Drizzle ORM | ^0.45.2 | ORM untuk PostgreSQL |
| `postgres` | ^3.4.9 | PostgreSQL driver |
| dotenv | ^17.4.2 | Environment variable loader |

### Infrastructure
| Tool | Fungsi |
|---|---|
| **Vercel** | Hosting frontend (CDN) + Serverless API functions |
| **Supabase / Neon** | PostgreSQL cloud database |
| **Vercel Cron** | Cron job harian (`0 0 * * *`) untuk deteksi Bara padam & grace period expire |
| **esbuild** | Bundle server code untuk Vercel Serverless |

### Testing & Dev Tools
| Tool | Fungsi |
|---|---|
| Vitest | Unit testing |
| Playwright | E2E testing |
| `@testing-library/react` | React component testing |
| oxlint | Linter |
| tsx | TypeScript executor (untuk dev server) |
| drizzle-kit | Database migration & schema push |

---

## 🗂️ Struktur Folder Project

```
web-streak/
├── api/                   # Bundled serverless entry (output esbuild, JANGAN EDIT MANUAL)
│   ├── index.js
│   └── [...path].js
├── server/                # SELURUH kode backend ada di sini
│   ├── index.ts           # Main API routes (Hono app) — file terbesar & terpenting
│   ├── auth.ts            # Better Auth config, CORS, rate limit config
│   ├── api-entry.ts       # Vercel serverless entry point (wrap app.fetch)
│   ├── validators.ts      # Zod schemas untuk semua input API
│   ├── rate-limiter.ts    # Rate limiter middleware berbasis IP
│   ├── seed.ts            # Script untuk seed data awal / development
│   ├── enable-rls.ts      # Script untuk enable Row Level Security di Supabase
│   ├── db/
│   │   ├── index.ts       # DB connection (postgres + drizzle)
│   │   ├── schema.ts      # Definisi tabel database
│   │   ├── migrate.ts     # Jalankan migrasi
│   │   └── drop.ts        # Drop semua tabel (HATI-HATI!)
│   └── __tests__/
│       ├── auth.test.ts
│       └── security.test.ts
├── src/                   # SELURUH kode frontend ada di sini
│   ├── App.tsx            # Routing utama (dengan ProtectedRoute & PublicOnlyRoute)
│   ├── main.tsx           # Entry point React
│   ├── pages/
│   │   ├── Dashboard.tsx  # Halaman utama (quest, streak, achievements) — file terbesar
│   │   ├── HomePage.tsx   # Landing page (sebelum login)
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Onboarding.tsx # Form pilih username + kategori favorit
│   │   └── Profile.tsx    # Edit profil
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Guard untuk rute yang butuh auth
│   │   └── PublicOnlyRoute.tsx  # Guard untuk rute login/register (redirect kalau sudah login)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Global auth state (user, loading, dsb.)
│   └── lib/               # Utility / API client functions
├── tests/
│   ├── local-e2e.spec.ts      # E2E test untuk local
│   ├── deployed-e2e.spec.ts   # E2E test untuk production
│   └── run-security-checks.ts # Script uji manual keamanan (27 test cases)
├── .env                   # ⛔ JANGAN COMMIT (ada di .gitignore)
├── .env.example           # ✅ Template env (safe to commit)
├── .gitignore
├── vercel.json            # Konfigurasi Vercel (routing & cron)
├── drizzle.config.ts      # Konfigurasi Drizzle ORM
├── vite.config.ts         # Konfigurasi Vite + proxy API
├── vitest.config.ts       # Konfigurasi testing
├── package.json
├── tsconfig.json
├── coldstart.md           # 📖 File ini
├── PRD_Streak_App_v1.2.md # Spesifikasi produk lengkap
├── PRD_Streak_App.md      # PRD versi awal (v1.0)
├── README.md              # Setup guide & dokumentasi teknis
└── USER_GUIDE.md          # Panduan pengguna
```

---

## 🔗 Link Penting

| Nama | URL |
|---|---|
| **Production App** | https://web-streak.vercel.app |
| **GitHub Repository** | https://github.com/Micleoo/web-streak |
| **Vercel Dashboard** | https://vercel.com/dashboard (login dengan akun tim) |
| **Supabase Project** | https://supabase.com/dashboard (cek di env `DATABASE_URL`) |

---

## 🔐 Environment Variables yang Dibutuhkan

Buat file `.env` di root project (lihat contoh di `.env.example`):

```env
# Database PostgreSQL (Supabase / Neon)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Better Auth
BETTER_AUTH_SECRET="random-string-min-32-chars"  # Generate: openssl rand -base64 32
BETTER_AUTH_URL="https://your-app.vercel.app/api/auth"
APP_URL="https://your-app.vercel.app"

# Google OAuth (opsional, bisa dikosongkan jika tidak pakai login Google)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Cron Job Protection
CRON_SECRET="random-secret-token-untuk-cron"

# Supabase Client (opsional, jika pakai Supabase SDK langsung)
VITE_SUPABASE_URL="https://xxx.supabase.co"
VITE_SUPABASE_ANON_KEY="xxx"
```

---

## ⚙️ Cara Setup & Jalankan Lokal

```bash
# 1. Clone
git clone https://github.com/Micleoo/web-streak.git
cd "web-streak"

# 2. Install dependencies
npm install

# 3. Buat file .env (copy dari .env.example, isi dengan credentials asli)
cp .env.example .env

# 4. Push schema database (jalankan sekali saat setup awal atau saat ada perubahan skema)
npx drizzle-kit push

# 5. (Opsional) Seed data awal
AUTO_SEED=true npm run dev:server

# 6. Jalankan dev server (butuh 2 terminal terpisah)
npm run dev:server  # Terminal 1 — Backend Hono di port 3000
npm run dev          # Terminal 2 — Frontend Vite di port 5173

# Akses di: http://localhost:5173
```

---

## 🗄️ Skema Database (Ringkasan)

```
user                  → profil, streak, XP, grace period
session               → token autentikasi (managed oleh Better Auth)
account               → OAuth accounts (Google)
verification          → email verification tokens
quests                → template quest milik user
quest_completions     → log setiap kali quest diselesaikan
friends               → relasi pertemanan (pending/accepted)
achievements          → badge yang sudah didapatkan user
```

**Field kritis di tabel `user`:**
- `currentStreak` — streak hari berturut-turut saat ini
- `maxStreak` — streak terpanjang yang pernah dicapai
- `totalXp` — total XP akumulatif (tidak pernah direset)
- `streakAtRisk` — `true` jika Bara sedang dalam grace period
- `gracePeriodUntil` — timestamp batas waktu pemulihan Bara
- `lastQuestCompletedAt` — timestamp quest terakhir diselesaikan

---

## 🏗️ Arsitektur & Alur Kerja

```
[Browser / Client (React)]
         │
         ▼ HTTP (fetch)
[Vite Dev Server :5173]
         │
         ▼ Proxy /api/* → :3000
[Hono API Server :3000]
         │
         ├──▶ [Better Auth] (session management)
         │
         └──▶ [Drizzle ORM] ──▶ [PostgreSQL (Supabase)]

--- Di Production ---
[Browser] ──▶ [Vercel CDN] (static dist/)
[Browser] ──▶ [Vercel Serverless Function: api/index.js]
                    │
                    └──▶ [Drizzle ORM] ──▶ [PostgreSQL (Supabase)]

[Vercel Cron (0 0 * * *)] ──POST /api/cron/daily──▶ [Serverless Function]
```

---

## 🔒 Keamanan (Security Hardening — done Agustus 2026)

Semua perbaikan ini sudah masuk ke commit `aa854a6`:

| Aspek | Implementasi |
|---|---|
| **Secrets** | Semua env vars hanya dibaca server-side, production check untuk `BETTER_AUTH_SECRET` |
| **`.gitignore`** | Pattern `.env*` + `!.env.example` (melindungi semua variasi env file) |
| **Rate Limiting** | Middleware berbasis IP: 120 req/min (API umum), 15 req/min (auth endpoints) |
| **Input Validation** | Zod schemas ketat untuk semua input (username, quest, profil, pertemanan) |
| **SQL Sanitization** | `escapeSqlLike()` untuk mencegah wildcard injection pada pencarian |
| **Error Handling** | Stack trace & cause dihapus dari response; error generik untuk production |
| **Auth Guards (FE)** | `ProtectedRoute` & `PublicOnlyRoute` di React Router |
| **Auth Guards (BE)** | Middleware `requireAuth` di semua endpoint privat |
| **CORS** | Whitelist ketat: hanya domain terpercaya yang diizinkan |
| **Cron Protection** | `/api/cron/daily` wajib `Authorization: Bearer <CRON_SECRET>` |
| **Logging** | `logger()` dari Hono untuk structured HTTP request logging |
| **Better Auth Rate Limit** | Diaktifkan: 50 req/60 detik per IP |

---

## 📌 Keputusan Penting (Architecture Decision Records)

### ADR-001: Pilih Hono sebagai Backend Framework
**Keputusan:** Menggunakan Hono (bukan Express atau Fastify).  
**Alasan:** Hono lebih ringan, edge-ready, dan kompatibel langsung dengan Vercel Serverless tanpa adapter tambahan. Web Standard API (`Request`/`Response`) memudahkan testing dan portabilitas.

### ADR-002: Pilih Better Auth (bukan NextAuth / Lucia)
**Keputusan:** Menggunakan Better Auth untuk autentikasi.  
**Alasan:** Support Drizzle ORM secara native, tidak butuh database adapter tambahan. Fleksibel untuk credentials + social provider dalam satu konfigurasi. Bukan framework-specific seperti NextAuth.

### ADR-003: Vanilla CSS (bukan Tailwind)
**Keputusan:** Menggunakan Vanilla CSS dengan variabel CSS custom.  
**Alasan:** Kontrol penuh atas desain glassmorphism dan animasi. Tidak ada overhead build Tailwind. Tim sudah familiar dengan CSS manual.

### ADR-004: Streak Reset via Cron + Client-side Grace Period Check
**Keputusan:** Deteksi Bara padam dilakukan oleh Vercel Cron (`0 0 * * *`), tapi pengecekan grace period saat user complete quest dilakukan di client + server.  
**Alasan:** Cron job tidak selalu akurat karena timezone user berbeda. Pengecekan di sisi client saat quest selesai lebih real-time dan akurat dari perspektif UX.

### ADR-005: Total XP tidak pernah direset
**Keputusan:** `totalXp` adalah nilai akumulatif permanen.  
**Alasan:** Reset XP membuat leaderboard jangka panjang tidak bermakna dan mengurangi motivasi user. Kolom `monthly_xp` yang sempat direncanakan dihapus karena tidak ada mekanisme reset yang natural.

### ADR-006: Hilangkan Auto-Provisioning User
**Keputusan:** Auto-provisioning dummy user pada login yang gagal dihapus.  
**Alasan:** Ini adalah celah keamanan — siapapun bisa membuat akun baru hanya dengan mencoba login. Pengguna harus register secara eksplisit.

### ADR-007: Seed Database hanya berjalan manual di development
**Keputusan:** `seedDatabase()` hanya dijalankan jika `NODE_ENV=development` DAN `AUTO_SEED=true`.  
**Alasan:** Auto-seed saat server start bisa merusak data production atau staging secara tidak sengaja.

### ADR-008: Sistem XP Level Tier & Progress Bar
**Keputusan:** Diterapkan sistem leveling 5 tier (🌱 Rookie: 0-199 XP, 🔥 Challenger: 200-499 XP, ⚡ Warrior: 500-999 XP, 🏆 Legend: 1000-1999 XP, 👑 Grand Master: 2000+ XP) dengan progress bar visual di Dashboard, Profile, dan badge di Leaderboard.  
**Alasan:** Memberikan visual feedback yang jelas dan target jangka pendek/menengah untuk akumulasi XP user serta membuat ranking XP di leaderboard terasa bermakna.

### ADR-009: Real-time Grace Period Countdown & Actionable Alert (Dashboard & Profile)
**Keputusan:** Grace Period 48 jam dilengkapi countdown timer real-time (update per detik), peringatan level urgensi (<12 jam), direct scroll-to-quest CTA, 2-step rescue guide di halaman Profile, serta feedback visual toast saat Bara berhasil dipulihkan (+20 XP).  
**Alasan:** Memastikan user langsung menyadari status Bara yang padam di halaman manapun (Dashboard maupun Profile) dan mengetahui batas waktu pemulihan sebelum streak direset permanen tanpa harus memahami mekanisme backend.

---

## 🔄 Riwayat Iterasi Development

| Fase | Deskripsi |
|---|---|
| **Initial** | Setup Vite + React, UI dasar, integrasi Supabase Auth |
| **Migration** | Migrasi ke BETH stack (Better Auth + Hono), hapus Supabase Auth |
| **Gamification** | Tambah sistem streak, XP, achievement badges |
| **Social** | Tambah sistem pertemanan dan leaderboard dual-mode |
| **Google OAuth** | Integrasi Google social login, fix berbagai bug Vercel + CORS |
| **PRD Refinement** | Ubah istilah "streak" jadi "Bara", hapus slot mekanisme, polish UX |
| **Testing** | Setup Vitest, Playwright E2E, TestSprite AI testing (100% pass) |
| **Security Hardening** | Rate limit, Zod validation, SQL escape, route guards, error sanitization |
| **XP Tier & Grace Period UI** | Implementasi XP Level Tiers (Rookie → Grand Master), progress bar, realtime Grace Period countdown & feedback di Dashboard dan Profile |

### ADR-010: Audit UX & Onboarding Overhaul (07 Aug 2026)
- **Konteks**: Berdasarkan hasil Quick Audit, onboarding lama belum memandu user menyusun 3 habit starter, landing page belum memiliki matrix perbandingan value prop vs kompetitor (Habitica/Todoist) serta penjelasan mekanisme Bara, dashboard butuh highlight metrik utama (Hero Card), dan fitur social butuh visibilitas lebih tinggi.
- **Keputusan**:
  1. **Multi-Step Onboarding (1-Minute Setup)**: Flow 3 langkah (Username check → Pick category & 3 starter habits/custom → Mini tutorial Bara) dengan auto-create starter quests ke backend.
  2. **Landing Page Value Prop & Bara Explainer**: Comparison matrix table vs Habitica & Todoist, 3-step visual guide, dan interactive animated HTML/CSS demo 3 state Bara Api (Menyala, Grace Period, Pulih).
  3. **Streak Hero Metric Card**: Highlight primary metric visual dengan glowing flame, streak counter besar, status Bara real-time, dan rekor streak tertinggi.
  4. **Social & Notification Visibility**: Banner promo pertemanan di sidebar, indikator peringkat user, dan real-time friend request counter badge di Navbar.
  5. **Mobile Quick-Add Habit**: Quick-add mode 1-baris responsif dengan expandable detail options (+ Waktu & Kategori) untuk touch targets yang nyaman.

---

## 📊 Status Terakhir (Per 07 Agustus 2026)

| Aspek | Status | Catatan |
|---|---|---|
| **Production** | 🟢 Live | https://web-streak.vercel.app |
| **GitHub Repo** | 🟢 Up-to-date | Branch `main` |
| **Database** | 🟢 Running | PostgreSQL di Supabase |
| **Google OAuth** | 🟢 Working | Sudah dikonfigurasi via Google Cloud Console |
| **Cron Job** | 🟢 Active | Berjalan setiap 00:00 UTC via Vercel Cron |
| **Security** | 🟢 Hardened | 27/27 security tests passed |
| **XP Level & Grace Period** | 🟢 Complete | 5 Tier leveling, progress bar, real-time countdown di Dashboard & Profile |
| **Onboarding Wizard** | 🟢 Complete | 3-step wizard (Username, 3 starter habits, Bara mini tutorial) |
| **Landing Page & Explainer** | 🟢 Complete | Comparison Matrix vs Habitica/Todoist & Animated Bara Explainer |
| **Streak Hero & Mobile UX** | 🟢 Complete | Streak Hero Card, social activity banner, friend request badge di Navbar & quick-add |
| **Unit Tests** | 🟢 Active | Unit tests untuk security & XP math (7/7 passed) |
| **Mobile Responsive** | 🟢 Responsive | Dashboard, Profile, Leaderboard, & Onboarding fully responsive |

---

## 🚀 Roadmap / Fitur yang Belum Dibuat (Post-MVP)

> Dari PRD v1.2, fitur-fitur ini direncanakan untuk iterasi selanjutnya:

- [ ] **Push Notification** — Reminder harian jika belum selesaikan quest
- [ ] **Quest Templates** — Preset template quest populer (Morning Routine, Exercise, dll.)
- [ ] **Weekly / Monthly Challenge** — Event spesial dengan reward ekstra
- [ ] **Dark/Light Mode Toggle** — Saat ini hanya dark mode
- [ ] **Quest Streak Individual** — Streak per quest, bukan hanya per hari
- [ ] **Email Verification** — Verifikasi email saat register
- [ ] **Friend Activity Feed** — Lihat activity teman secara real-time
- [ ] **Export Progress** — Download data progress sebagai CSV/PDF

---

## ⚠️ Hal-hal yang Perlu Diperhatikan (Gotchas)

1. **Vitest environment clash** — Server tests (`server/__tests__/`) butuh environment `node`, tapi vitest.config.ts default ke `jsdom`. Sudah dikonfigurasi lewat `environmentMatchGlobs`, tapi jika ada test baru di server, pastikan path match glob `server/**`.

2. **Vercel Cron timezone** — Cron berjalan di UTC. Deteksi Bara padam di cron menggunakan UTC. Pengecekan grace period saat user complete quest menggunakan waktu server (juga UTC). Pastikan ini konsisten.

3. **Database connection di Vercel** — Gunakan Transaction Pooler (port 6543) dari Supabase, BUKAN Session Pooler atau Direct Connection. Serverless function tidak mendukung persistent connection.

4. **esbuild bundle** — File `api/index.js` dan `api/[...path].js` adalah output bundle dari `server/api-entry.ts`. File ini di-generate otomatis saat `npm run build`. Jangan edit manual.

5. **CRON_SECRET wajib di production** — Tanpa `CRON_SECRET` di environment variables Vercel, cron job akan di-reject dengan 401. Set di Vercel Dashboard → Settings → Environment Variables.

6. **Google OAuth redirect URL** — Saat testing lokal, pastikan `http://localhost:5173/api/auth/callback/google` sudah ditambahkan ke Google Cloud Console OAuth authorized redirect URIs.
