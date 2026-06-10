// Konfigurasi Swagger/OpenAPI untuk menghasilkan dokumentasi API secara otomatis
// dari anotasi JSDoc yang ada di file route. Dokumentasi tersedia di /api-docs.
import swaggerJsdoc from "swagger-jsdoc"

// Opsi konfigurasi Swagger: metadata API, server URL, dan pola file route yang dibaca
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkyIntern E-Ticketing API",
      version: "1.0.0",
      description: [
        "Dokumentasi REST API SkyIntern E-Ticketing System.",
        "",
        "Alur testing yang disarankan:",
        "1. Auth - register/login untuk mendapatkan access token.",
        "2. Klik Authorize dan isi token dengan format Bearer JWT.",
        "3. Uji endpoint Public Flights untuk mencari penerbangan.",
        "4. Uji Booking Flow untuk membuat booking, pembayaran, tiket, dan verifikasi.",
        "5. Gunakan akun ADMIN untuk mencoba endpoint Admin."
      ].join("\n")
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server"
      }
    ],
    tags: [
      {
        name: "Auth",
        description: "Registrasi, login, 2FA, refresh token, profil, avatar, dan reset password."
      },
      {
        name: "Public - Flights",
        description: "Endpoint publik untuk daftar bandara, pencarian penerbangan, dan detail penerbangan."
      },
      {
        name: "Flight Seats",
        description: "Seat map, hold seat, dan release seat saat proses booking."
      },
      {
        name: "Booking Flow",
        description: "Membuat booking, upload dokumen penumpang, pembayaran, pembatalan, tiket, dan riwayat booking."
      },
      {
        name: "Payment Webhook",
        description: "Webhook dan sinkronisasi status pembayaran Midtrans."
      },
      {
        name: "Ticket Verification",
        description: "Verifikasi booking/e-ticket berdasarkan kode booking atau QR."
      },
      {
        name: "Promos",
        description: "Promo aktif yang dapat ditampilkan ke pengguna."
      },
      {
        name: "Files",
        description: "Proxy file publik dari object storage."
      },
      {
        name: "Admin - Airports",
        description: "Manajemen data bandara dan gambar kota."
      },
      {
        name: "Admin - Airlines",
        description: "Manajemen data maskapai dan logo."
      },
      {
        name: "Admin - Flights",
        description: "Manajemen jadwal penerbangan."
      },
      {
        name: "Admin - Seats",
        description: "Manajemen kursi penerbangan."
      },
      {
        name: "Admin - Bookings",
        description: "Manajemen booking, transaksi, status, dan reminder."
      },
      {
        name: "Admin - Users",
        description: "Manajemen user, blokir user, dan pengaturan 2FA."
      },
      {
        name: "Admin - Promos",
        description: "Manajemen promo."
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Terjadi kesalahan"
            }
          }
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            totalItems: { type: "integer", example: 25 },
            totalPages: { type: "integer", example: 3 },
            hasNextPage: { type: "boolean", example: true },
            hasPrevPage: { type: "boolean", example: false }
          }
        },
        Promo: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Diskon Akhir Pekan" },
            description: { type: "string", nullable: true, example: "Promo tiket weekend" },
            discount: { type: "integer", example: 50000 },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            isActive: { type: "boolean", example: true },
            flightId: { type: "integer", nullable: true, example: null }
          }
        }
      }
    }
  },
  apis: ["./src/index.ts", "./src/routes/*.ts"]
}

export default swaggerJsdoc(options)
