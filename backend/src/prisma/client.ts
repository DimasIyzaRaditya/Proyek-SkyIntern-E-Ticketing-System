// Membuat dan mengekspor satu instance PrismaClient yang terhubung ke database
// PostgreSQL menggunakan connection pool (pg). Instance ini digunakan di seluruh aplikasi.
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL // URL koneksi database dari environment variable

if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi")
}

const pool = new Pool({ connectionString }) // Connection pool PostgreSQL untuk efisiensi koneksi
const adapter = new PrismaPg(pool) // Adapter Prisma agar bisa menggunakan pg Pool

const prisma = new PrismaClient({ adapter }) // Instance PrismaClient yang digunakan di seluruh aplikasi

export default prisma
