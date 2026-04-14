# SkyIntern E-Ticketing System

Sistem E-Ticketing pesawat yang terdiri dari tiga komponen utama:

- **Backend** — REST API dengan Node.js, Express, TypeScript, dan Prisma ORM (PostgreSQL)
- **Web** — Frontend admin & user berbasis Next.js
- **Mobile** — Aplikasi Flutter untuk pengguna

---

## Prasyarat

Pastikan sudah terinstall sebelum memulai:

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) (lokal atau remote)
- [MinIO](https://min.io/) (object storage untuk upload file)
- [Flutter SDK](https://flutter.dev/docs/get-started/install) v3.9+
- Akun [Midtrans](https://midtrans.com/) (payment gateway)
- Akun SMTP (misalnya Gmail App Password)

---

## Setup Setelah Clone

### 1. Backend

```bash
cd backend
```

Salin file environment dan isi nilainya:

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi lokal:

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your_jwt_secret_key"

MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY="your_midtrans_server_key"
MIDTRANS_CLIENT_KEY="your_midtrans_client_key"

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_URL=http://localhost:9000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@skyintern.com

FRONTEND_URL=http://localhost:3001
```

Install dependensi, jalankan migrasi, dan seed database:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`. Dokumentasi Swagger tersedia di `http://localhost:3000/api-docs`.

---

### 2. Web

```bash
cd web
npm install
npm run dev
```

Aplikasi web berjalan di `http://localhost:3001`.

---

### 3. Mobile

```bash
cd mobile
flutter pub get
```

> **Catatan:**  ubah `_hardcodedApiHost` di `lib/services/api_client.dart`

NOTE : sesuaikan dengan ip jaringan yang terhubung dengan device backend

Jalankan aplikasi:

```bash
flutter run
```

---

## Struktur Proyek

```
├── backend/    # REST API (Express + Prisma + PostgreSQL)
├── web/        # Frontend web (Next.js)
└── mobile/     # Aplikasi mobile (Flutter)
```

---

## Konvensi Penamaan (Web & Mobile)

- Flutter (`mobile/lib`): gunakan `snake_case` untuk nama file Dart (contoh: `booking_payment_screen.dart`).
- Next.js route (`web/src/app`): gunakan segment route lowercase dengan `kebab-case` bila terdiri dari beberapa kata (contoh: `e-ticket`).
- React component (`web/src/components`): gunakan `PascalCase` untuk file komponen (contoh: `AdminSalesChart.tsx`).
- Utility module (`web/src/lib`): gunakan `kebab-case` (contoh: `admin-api.ts`).
- Hindari mencampur artefak package manager: proyek Flutter tidak memakai npm lockfile di root `mobile`.
