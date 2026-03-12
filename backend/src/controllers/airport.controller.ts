// Controller bandara (airport). Menyediakan operasi CRUD untuk data bandara (admin)
// serta endpoint publik untuk opsi pencarian bandara beserta kode IATA-nya.
import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { Request } from "express"
import { uploadFile, deleteFile } from "../utils/minio"

// Daftar alias nama bandara ke kode IATA untuk bandara-bandara populer
const airportCodeAliases: Array<{ keyword: string; code: string }> = [
  { keyword: "soekarno", code: "CGK" },
  { keyword: "ngurah", code: "DPS" },
  { keyword: "juanda", code: "SUB" },
  { keyword: "changi", code: "SIN" },
  { keyword: "kualanamu", code: "KNO" },
  { keyword: "yogyakarta", code: "YIA" },
  { keyword: "sepinggan", code: "BPN" },
  { keyword: "sultan hasanuddin", code: "UPG" }
]

// Menentukan kode IATA bandara: cek alias dulu, jika tidak ada gunakan 3 huruf pertama kota,
// jika gagal gunakan format APT+id sebagai fallback
const deriveAirportCode = (airport: { id: number; name: string; city: string }) => {
  const normalized = `${airport.name} ${airport.city}`.toLowerCase() // Gabungan nama & kota dalam huruf kecil untuk pencocokan alias
  const alias = airportCodeAliases.find((item) => normalized.includes(item.keyword)) // Cek apakah cocok dengan alias yang dikenal
  if (alias) return alias.code

  const onlyLetters = airport.city.replace(/[^a-zA-Z]/g, "").toUpperCase() // Hanya karakter huruf dari nama kota
  const cityCode = onlyLetters.slice(0, 3) // Ambil 3 huruf pertama sebagai kode
  if (cityCode.length === 3) return cityCode

  return `APT${airport.id}` // Fallback jika nama kota terlalu pendek
}

// Airport Management
export const createAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { name, city, country, timezone, cityImageUrl } = req.body // Data bandara dari body request

    const airport = await prisma.airport.create({ // Simpan bandara baru ke database
      data: { name, city, country, timezone, cityImageUrl: cityImageUrl ?? null }
    })

    res.status(201).json({
      message: "Bandara berhasil dibuat",
      airport
    })
  } catch (error: any) {
    console.error("Create airport error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Kode bandara sudah digunakan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getAllAirports = async (req: AuthRequest, res: Response) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { name: "asc" }
    }) // Ambil semua bandara urut abjad

    res.json({ airports })
  } catch (error) {
    console.error("Get all airports error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getPublicAirportOptions = async (req: Request, res: Response) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { city: "asc" }
    }) // Ambil semua bandara urut berdasarkan kota

    const options = airports.map((airport) => { // Transformasi ke format dropdown dengan kode IATA & label
      const code = deriveAirportCode(airport) // Kode IATA bandara yang diturunkan

      return {
        id: airport.id,
        code,
        city: airport.city,
        country: airport.country,
        airportName: airport.name,
        cityImageUrl: (airport as any).cityImageUrl ?? null,
        label: `${airport.city}, ${airport.country} (${code})`
      }
    })

    res.json({ airports: options })
  } catch (error) {
    console.error("Get public airport options error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID bandara dari URL param

    const airport = await prisma.airport.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cari bandara berdasarkan ID

    if (!airport) {
      return res.status(404).json({ message: "Bandara tidak ditemukan" })
    }

    res.json({ airport })
  } catch (error) {
    console.error("Get airport error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const updateAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID bandara dari URL param
    const { name, city, country, timezone, cityImageUrl } = req.body // Field bandara yang diperbarui

    const airport = await prisma.airport.update({ // Perbarui data bandara
      where: { id: parseInt(id as string) },
      data: { name, city, country, timezone, ...(cityImageUrl !== undefined ? { cityImageUrl } : {}) }
    })

    res.json({
      message: "Bandara berhasil diperbarui",
      airport
    })
  } catch (error: any) {
    console.error("Update airport error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bandara tidak ditemukan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const deleteAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.airport.delete({
      where: { id: parseInt(id as string) }
    })

    res.json({ message: "Bandara berhasil dihapus" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bandara tidak ditemukan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Upload city image for an airport to MinIO and save URL to DB
export const uploadAirportCityImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: "File gambar wajib dilampirkan" })
    }

    const airport = await prisma.airport.findUnique({ where: { id: parseInt(id as string) } })
    if (!airport) {
      return res.status(404).json({ message: "Bandara tidak ditemukan" })
    }

    // Delete old image from MinIO if it exists and is a MinIO URL
    const oldUrl = (airport as any).cityImageUrl as string | null
    if (oldUrl) {
      const minioBase = process.env.MINIO_URL || "http://localhost:9000"
      if (oldUrl.startsWith(minioBase)) {
        const fileName = oldUrl.replace(`${minioBase}/skyintern/`, "")
        await deleteFile(fileName).catch(() => {}) // Non-fatal
      }
    }

    const ext = file.mimetype.split("/")[1] || "jpg"
    const fileName = `airports/city-${id}-${Date.now()}.${ext}`
    const cityImageUrl = await uploadFile(fileName, file.buffer, file.mimetype)

    await prisma.airport.update({
      where: { id: parseInt(id as string) },
      data: { cityImageUrl }
    })

    res.json({ cityImageUrl })
  } catch (error: any) {
    console.error("Upload airport city image error:", error)
    if (error.message?.includes("MinIO")) {
      return res.status(503).json({ message: "MinIO tidak berjalan. Jalankan MinIO di port 9000 terlebih dahulu." })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
