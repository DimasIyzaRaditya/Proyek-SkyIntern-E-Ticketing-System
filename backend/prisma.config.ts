/// <reference types="node" />
// Agar TypeScript mengenali tipe bawaan Node.js seperti process

import "dotenv/config";
// Membaca file .env agar variabel environment bisa digunakan

import process from "node:process";
// Digunakan untuk mengakses environment variable (process.env)

import { defineConfig } from "prisma/config";
// Fungsi dari Prisma untuk membuat konfigurasi project

export default defineConfig({

  // Lokasi file schema Prisma (isi struktur database)
  schema: "prisma/schema.prisma",

  migrations: {
    // Folder tempat menyimpan file migrasi database
    path: "prisma/migrations",
  },

  datasource: {
    // Mengambil alamat database dari file .env
    url: process.env["DATABASE_URL"],
  },

});