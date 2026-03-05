// Controller maskapai penerbangan (airline). Menyediakan operasi CRUD untuk data
// maskapai, termasuk upload/hapus logo ke MinIO object storage.
import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { uploadFile, deleteFile } from "../utils/minio"

export const createAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, country } = req.body // Data maskapai dari body request
    const file = req.file // File logo yang diupload (opsional)

    if (!code || !name || !country) {
      return res.status(400).json({ message: "Kode, nama, dan negara wajib diisi" })
    }

    let logoUrl: string | undefined // URL logo setelah diupload ke MinIO

    if (file) {
      const fileName = `airlines/${code}-${Date.now()}.${file.mimetype.split("/")[1]}` // Nama file unik berdasarkan kode & timestamp
      logoUrl = await uploadFile(fileName, file.buffer, file.mimetype)
    }

    const airline = await prisma.airline.create({ // Simpan data maskapai baru ke database
      data: {
        code,
        name,
        country,
        logo: logoUrl
      }
    })

    res.status(201).json({
      message: "Maskapai berhasil dibuat",
      airline
    })
  } catch (error: any) {
    console.error("Create airline error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Kode maskapai sudah digunakan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getAllAirlines = async (req: AuthRequest, res: Response) => {
  try {
    const airlines = await prisma.airline.findMany({
      orderBy: { name: "asc" }
    }) // Ambil semua maskapai urut abjad

    res.json({ airlines })
  } catch (error) {
    console.error("Get all airlines error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID maskapai dari URL param

    const airline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cari maskapai berdasarkan ID

    if (!airline) {
      return res.status(404).json({ message: "Maskapai tidak ditemukan" })
    }

    res.json({ airline })
  } catch (error) {
    console.error("Get airline error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const updateAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID maskapai dari URL param
    const { code, name, country } = req.body // Data maskapai yang diperbarui
    const file = req.file // File logo baru (opsional)

    if (!code || !name || !country) {
      return res.status(400).json({ message: "Kode, nama, dan negara wajib diisi" })
    }

    const existingAirline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cek maskapai yang ingin diperbarui

    if (!existingAirline) {
      return res.status(404).json({ message: "Maskapai tidak ditemukan" })
    }

    let logoUrl = existingAirline.logo // Pertahankan logo lama jika tidak ada file baru

    if (file) {
      // Delete old logo if exists
      if (existingAirline.logo) {
        try {
          const oldFileName = existingAirline.logo.split("/").pop() // Ambil nama file logo lama dari URL
          if (oldFileName) {
            await deleteFile(`airlines/${oldFileName}`)
          }
        } catch (error) {
          console.error("Error deleting old logo:", error)
        }
      }

      // Upload new logo
      const fileName = `airlines/${code}-${Date.now()}.${file.mimetype.split("/")[1]}` // Nama file logo baru yang unik
      logoUrl = await uploadFile(fileName, file.buffer, file.mimetype)
    }

    const airline = await prisma.airline.update({
      where: { id: parseInt(id as string) },
      data: {
        code,
        name,
        country,
        logo: logoUrl
      }
    })

    res.json({
      message: "Maskapai berhasil diperbarui",
      airline
    })
  } catch (error: any) {
    console.error("Update airline error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const deleteAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID maskapai dari URL param

    const airline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cari maskapai yang akan dihapus

    if (!airline) {
      return res.status(404).json({ message: "Maskapai tidak ditemukan" })
    }

    // Delete logo from Minio
    if (airline.logo) {
      try {
        const fileName = airline.logo.split("/").pop() // Nama file logo yang akan dihapus dari MinIO
        if (fileName) {
          await deleteFile(`airlines/${fileName}`)
        }
      } catch (error) {
        console.error("Error deleting logo:", error)
      }
    }

    await prisma.airline.delete({
      where: { id: parseInt(id as string) }
    })

    res.json({ message: "Maskapai berhasil dihapus" })
  } catch (error: any) {
    console.error("Delete airline error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const removeAirlineLogo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID maskapai dari URL param

    const airline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cari maskapai yang logo-nya akan dihapus

    if (!airline) {
      return res.status(404).json({ message: "Maskapai tidak ditemukan" })
    }

    if (!airline.logo) {
      return res.status(400).json({ message: "Maskapai tidak memiliki logo" })
    }

    // Try to delete from MinIO (best-effort, file might already be missing)
    try {
      const urlPath = new URL(airline.logo).pathname // Path dari URL logo MinIO
      const objectName = urlPath.replace(/^\/[^\/]+\//, "") // Nama objek di bucket (tanpa prefix bucket)
      if (objectName) await deleteFile(objectName)
    } catch (deleteError) {
      console.warn("Could not delete logo from MinIO (file may already be missing):", deleteError)
    }

    const updated = await prisma.airline.update({
      where: { id: parseInt(id as string) },
      data: { logo: null }
    }) // Hapus referensi logo dari database

    res.json({
      message: "Logo berhasil dihapus",
      airline: updated
    })
  } catch (error: any) {
    console.error("Remove airline logo error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
