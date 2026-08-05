# 🔥 Streak App — Daily Quest Tracker with Gamified Bara Mechanic

> **Streak** adalah aplikasi web *daily quest tracker* berbasis gamifikasi yang dirancang untuk membantu mahasiswa dan pengguna umum membangun rutinitas harian yang konsisten, menyenangkan, dan kompetitif.

[![Live Demo](https://img.shields.io/badge/Demo-web--streak.vercel.app-orange?style=for-the-badge&logo=vercel)](https://web-streak.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Hono_|_PostgreSQL_|_Better--Auth-blue?style=for-the-badge)](https://web-streak.vercel.app)

---

## 🌟 Fitur Utama (MVP PRD v1.2)

1. **🔥 Sistem Bara (Streak Counter):**
   - Ikon Bara menyala setelah **3 hari aktif berturut-turut**.
   - Cukup selesaikan minimal 1 quest per hari sebelum pukul 23:59 waktu lokal.
2. **🛡️ Grace Period 48 Jam & Restore:**
   - Jika Bara padam karena terlewat 1 hari, Bara masuk status abu-abu.
   - User memiliki waktu **48 jam** untuk memulihkan Bara (+20 XP bonus pemulihan) tanpa kehilangan jumlah streak.
3. **📋 Reusable Quest System:**
   - Template quest tidak hilang setelah diselesaikan, dapat diceklis berulang kali setiap hari.
   - Lengkap dengan kategori (Coding, Exercise, Learning, Hobby, Social, Chore, Custom), estimasi waktu, dan **History Completion Log**.
4. **⚡ XP & Milestone Rewards:**
   - +10 XP per quest completion.
   - +50 XP bonus milestone di hari ke-7 streak berturut-turut.
   - +20 XP saat memulihkan Bara (Restore).
   - Total XP bersifat akumulatif selamanya.
5. **🏆 Achievement Badges:**
   - *Week Warrior* (7-day streak)
   - *Fortnight Fighter* (14-day streak)
   - *Monthly Master* (30-day streak)
   - *Century Quester* (100 total completions)
   - *Quest Legend* (200 total completions)
6. **👥 Social & Dual Leaderboard:**
   - Sistem pertemanan dua arah (mutual friend requests).
   - **Global Leaderboard (Top 10)** & **Friends Leaderboard** dengan pembaruan otomatis setiap 1 menit (polling).
7. **🔒 Autentikasi Modern:**
   - Registrasi & Login via Email/Password serta **Google OAuth** melalui *Better-Auth*.
   - Onboarding dengan validasi username unik & pemilihan kategori favorit.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS modern (Glassmorphism & Micro-animations), Lucide Icons.
- **Backend:** Hono API Server, Node.js / Vercel Serverless Functions.
- **Database & ORM:** PostgreSQL (Neon / Supabase) + Drizzle ORM.
- **Autentikasi:** Better-Auth (Credentials & Google Social Provider).
- **Automation / Cron:** Vercel Cron (`/api/cron/daily`) untuk deteksi Bara padam & fallback pemulihan.
- **Deployment:** Vercel CDN & Serverless.

---

## 🚀 Menjalankan Project Secara Lokal

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "web streak"
npm install
```

### 2. Konfigurasi Environment Variables
Buat file `.env` di root direktori project:

```env
# Database PostgreSQL
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-strong-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:5173"
APP_URL="http://localhost:5173"

# Google OAuth (Opsional untuk login Google)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Setup Database (Migrasi / Push Schema)
```bash
npx drizzle-kit push
```

*(Opsional) Seed Data Awal Leaderboard:*
```bash
npx tsx server/seed.ts
```

### 4. Menjalankan Server Development
Buka 2 terminal:
```bash
# Terminal 1: Backend Server (Hono)
npm run dev:server

# Terminal 2: Frontend App (Vite)
npm run dev
```

Buka browser di `http://localhost:5173`.

---

## 🧪 Testing & Verifikasi

Project ini telah diuji secara menyeluruh:
```bash
# Menjalankan Unit Tests (Vitest)
npm run test

# Menjalankan E2E Tests (Playwright)
npx playwright test
```

- **Backend API Test Coverage:** 100% Passed (9 / 9 test cases via TestSprite AI).
- **E2E Production Flow:** 100% Passed pada `https://web-streak.vercel.app`.

---

## 📖 Dokumentasi Lengkap
- Panduan Pengguna: [USER_GUIDE.md](USER_GUIDE.md)
- Dokumen Spesifikasi Produk: [PRD_Streak_App_v1.2.md](PRD_Streak_App_v1.2.md)
