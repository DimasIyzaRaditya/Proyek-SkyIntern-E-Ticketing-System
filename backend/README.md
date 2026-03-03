# SkyIntern E-Ticketing System - Backend API

Backend API untuk sistem pemesanan tiket pesawat online yang comprehensive, dibangun dengan Node.js, Express, PostgreSQL, Prisma ORM, dan MinIO untuk object storage.

## 🚀 Teknologi

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL
- **ORM**: Prisma 7.x
- **Object Storage**: MinIO
- **Authentication**: JWT (JSON Web Token)
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Fitur

### A. Fitur untuk Pengguna (Customer)

#### 1. Manajemen Akun (Authentication)
- ✅ Registrasi akun dengan email & password
- ✅ Login & Logout menggunakan JWT token
- ✅ Lupa Password: Reset password via email
- ✅ Profil Pengguna: Lihat dan edit data diri (Nama, No. HP)

#### 2. Pencarian & Pemilihan Penerbangan
- ✅ Search Flight berdasarkan:
  - Kota Asal (Origin)
  - Kota Tujuan (Destination)
  - Tanggal Pergi
  - Jumlah Penumpang (Dewasa/Anak)
- ✅ Filter & Sort berdasarkan:
  - Harga (Termurah/Termahal)
  - Durasi penerbangan
  - Jam keberangkatan
- ✅ Flight Detail: Detail informasi maskapai, tipe pesawat, fasilitas, dan aturan
- ✅ Seat Selection (Pemilihan Kursi):
  - Tampilan denah kursi (Seat Map) interaktif
  - Indikator warna: Tersedia (Available), Terpilih (Selected), Terisi (Occupied)
  - Informasi harga tambahan untuk kursi khusus (Exit Row)

#### 3. Pemesanan & Pembayaran (Booking Flow)
- ✅ Form Data Penumpang: Input data sesuai KTP/Paspor
- ✅ Ringkasan Pembayaran: Rincian harga tiket + Pajak + Biaya Admin
- ✅ Simulasi Pembayaran:
  - Pilihan metode: Transfer Bank, Kartu Kredit, E-Wallet
  - Integrasi simulasi Payment Gateway
- ✅ Timer Booking: Countdown 15 menit di halaman pembayaran

#### 4. E-Ticket & Riwayat
- ✅ Daftar Pesanan (My Bookings): Status Upcoming, Completed, Cancelled
- ✅ E-Ticket Viewer:
  - Detail boarding pass digital
  - QR Code untuk scan di bandara
  - Tombol Download PDF (via MinIO)
- ✅ Status Pemesanan: Real-time update (Pending → Paid → Issued)

### B. Fitur untuk Admin (Dashboard)

#### 1. Manajemen Data Master (CRUD)
- ✅ Manajemen Bandara: CRUD data bandara (Kode, Nama, Lokasi)
- ✅ Manajemen Maskapai: CRUD dengan upload logo (via MinIO)
- ✅ Manajemen Jadwal Penerbangan:
  - Input rute penerbangan
  - Set harga dasar tiket, pajak, biaya admin
  - Set waktu keberangkatan dan kedatangan
  - Set informasi pesawat & fasilitas

#### 2. Manajemen Kursi (Seat Management)
- ✅ Create seats untuk setiap penerbangan
- ✅ Generate standard seat configuration
- ✅ Set harga tambahan per kursi
- ✅ Update status kursi

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- MinIO Server
- npm atau yarn

### 1. Clone & Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Environment Configuration

Copy file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_skyintern"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# MinIO Object Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_URL=http://localhost:9000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@skyintern.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Server
PORT=3000
\`\`\`

### 3. Setup PostgreSQL Database

\`\`\`bash
# Buat database
createdb db_skyintern

# Atau via psql
psql -U postgres
CREATE DATABASE db_skyintern;
\`\`\`

### 4. Setup MinIO

Download dan jalankan MinIO:

\`\`\`bash
# Windows
minio.exe server C:\\minio-data

# Linux/Mac
minio server /data
\`\`\`

Akses MinIO Console di `http://localhost:9000` dengan credentials:
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

### 5. Database Migration

\`\`\`bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run migrate

# Atau push schema langsung (development only)
npm run db:push
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

Akses Swagger UI untuk dokumentasi API lengkap:

\`\`\`
http://localhost:3000/api-docs
\`\`\`

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register user baru
- `POST /login` - Login user
- `GET /verify` - Verify JWT token
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update profile (protected)
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

#### Admin - Airports (`/api/admin/airports`)  
- `POST /` - Create airport
- `GET /` - Get all airports
- `GET /:id` - Get airport by ID
- `PUT /:id` - Update airport
- `DELETE /:id` - Delete airport

#### Admin - Airlines (`/api/admin/airlines`)
- `POST /` - Create airline (dengan upload logo)
- `GET /` - Get all airlines
- `GET /:id` - Get airline by ID
- `PUT /:id` - Update airline (dengan upload logo)
- `DELETE /:id` - Delete airline

#### Admin - Flights (`/api/admin/flights`)
- `POST /` - Create flight
- `GET /` - Get all flights (admin view)
- `PUT /:id` - Update flight
- `DELETE /:id` - Delete flight

#### Admin - Seats (`/api/admin/seats`)
- `POST /` - Create seats for flight
- `PUT /:id` - Update seat
- `POST /generate` - Generate standard seats

#### Flights (`/api/flights`)
- `GET /search` - Search flights dengan filter
- `GET /:id` - Get flight detail
- `GET /:flightId/seats` - Get seat map

#### Bookings (`/api/bookings`)
- `POST /` - Create booking
- `POST /:id/payment` - Process payment
- `GET /` - Get user bookings
- `GET /:id` - Get booking detail
- `POST /:id/cancel` - Cancel booking
- `GET /tickets/:id` - Get ticket detail

## 🔐 Authentication & Authorization

API menggunakan JWT (JSON Web Token) untuk authentication.

### Login Flow

1. User register/login → Receive JWT token
2. Include token di header setiap request:
   \`\`\`
   Authorization: Bearer <your_jwt_token>
   \`\`\`

### Roles

- **USER**: Customer biasa (default)
- **ADMIN**: Administrator dengan akses penuh ke admin endpoints

## 📊 Database Schema

### Core Models

- **User**: User accounts dengan role
- **Airport**: Data bandara
- **Airline**: Data maskapai dengan logo
- **Flight**: Jadwal penerbangan
- **Seat**: Master data kursi
- **FlightSeat**: Kursi per penerbangan dengan status
- **Booking**: Data pemesanan
- **Passenger**: Data penumpang
- **Payment**: Data pembayaran
- **Ticket**: E-ticket dengan QR code

## 🎯 Workflow Booking

1. **Search**: User mencari penerbangan berdasarkan origin, destination, date
2. **Select Flight**: User memilih penerbangan
3. **Select Seats**: User memilih kursi (optional)
4. **Input Passenger Data**: User input data penumpang
5. **Review & Payment**: User review total harga dan pilih metode pembayaran
6. **Timer**: 15 menit countdown untuk menyelesaikan pembayaran
7. **Process Payment**: System process payment dan update booking status
8. **Generate Ticket**: System generate e-ticket dengan QR code
9. **Send Email**: System kirim konfirmasi booking via email

## 📝 Scripts

\`\`\`bash
# Development
npm run dev              # Run development server dengan hot reload

# Build
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Database
npm run migrate          # Run database migrations
npm run migrate:deploy   # Deploy migrations (production)
npm run db:push          # Push schema changes (development)
npm run prisma:generate  # Generate Prisma Client

# Seed (optional)
npm run db:seed          # Seed database dengan data awal
\`\`\`

## 🔧 Troubleshooting

### Database Connection Error

Pastikan PostgreSQL berjalan dan DATABASE_URL di `.env` sudah benar.

### MinIO Connection Error

Pastikan MinIO server berjalan di port 9000 dan credentials sesuai.

### Email Not Sending

Untuk Gmail, aktifkan "App Password" di security settings dan gunakan app password tersebut di SMTP_PASS.

### Migration Error

Jika ada error saat migration, coba:
\`\`\`bash
npx prisma migrate reset  # Reset database (WARNING: akan hapus semua data)
npm run migrate
\`\`\`

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Setup proper SMTP credentials
- [ ] Configure production DATABASE_URL
- [ ] Setup MinIO with proper access keys
- [ ] Enable SSL for MinIO (MINIO_USE_SSL=true)
- [ ] Set FRONTEND_URL to production URL
- [ ] Run `npm run migrate:deploy` instead of `migrate`

## 📄 License

ISC

## 👥 Contributors

SkyIntern Team - Microdata Internship Program 2026

---

**Happy Coding! ✈️**
