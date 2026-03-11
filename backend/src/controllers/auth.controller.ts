// Controller autentikasi. Menangani registrasi & login user, verifikasi JWT,
// manajemen profil, alur lupa/reset password via email, hapus akun,
// serta pengambilan daftar semua user (khusus admin).
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Request, Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { generateResetToken, addMinutes } from "../utils/helpers"
import { sendResetPasswordEmail } from "../utils/email"
import { uploadFile, deleteFile } from "../utils/minio"

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body // Data registrasi dari body request

    const hashed = await bcrypt.hash(password, 10) // Password di-hash dengan bcrypt (salt 10 round)

    const user = await prisma.user.create({ // Simpan user baru ke database
      data: { email, name, password: hashed }
    })

    res.status(201).json({
      message: "Registrasi berhasil",
      user
    })

  } catch (error: any) {
    console.error("Register error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Email atau nama sudah digunakan"
      })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body // Kredensial login dari body request

    const user = await prisma.user.findUnique({
      where: { email }
    }) // Cari user berdasarkan email

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    const valid = await bcrypt.compare(password, user.password) // Validasi password dengan hash di database

    if (!valid) {
      return res.status(401).json({ message: "Password salah" })
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Akun Anda telah diblokir." })
    }

    const token = jwt.sign( // Buat JWT token berisi id, email, role user, berlaku 1 hari
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    )

    res.json({
      message: "Login berhasil",
      token
    })

  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization // Header Authorization dari request
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token tidak ditemukan" })
    }

    const token = authHeader.substring(7) // Ambil token setelah "Bearer "

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) // Verifikasi & decode isi JWT

    res.json({
      message: "Token valid",
      decoded
    })

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token telah kedaluwarsa" })
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token tidak valid" })
    }
    console.error("Verify token error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id }, // Ambil data profil user yang sedang login
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatarUrl } = req.body // Field profil yang ingin diperbarui

    const data: any = {} // Objek berisi hanya field yang dikirimkan (partial update)
    if (typeof name === "string") data.name = name
    if (typeof phone === "string") data.phone = phone
    if (avatarUrl === null || typeof avatarUrl === "string") data.avatarUrl = avatarUrl

    const user = await prisma.user.update({ // Perbarui profil user di database
      where: { id: req.user?.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true
      }
    })

    res.json({
      message: "Profil berhasil diperbarui",
      user
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file // File avatar dari multipart/form-data

    if (!file) {
      return res.status(400).json({ message: "File gambar wajib dikirimkan" })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP" })
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Ukuran file maksimal 5MB" })
    }

    const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg")
    const fileName = `avatars/user-${req.user?.id}-${Date.now()}.${ext}` // Nama file unik di MinIO

    // Hapus avatar lama jika ada & tersimpan di MinIO
    const existing = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { avatarUrl: true }
    })
    if (existing?.avatarUrl && existing.avatarUrl.includes("/avatars/")) {
      const oldKey = existing.avatarUrl.split(`/skyintern/`)[1]
      if (oldKey) await deleteFile(oldKey).catch(() => { /* silent */ })
    }

    const avatarUrl = await uploadFile(fileName, file.buffer, file.mimetype) // Upload ke MinIO

    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true }
    })

    res.json({ message: "Foto profil berhasil diperbarui", user })
  } catch (error: any) {
    console.error("Upload avatar error:", error)
    if (error.message?.includes("MinIO") || error.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "Server penyimpanan file tidak tersedia. Pastikan MinIO berjalan di port 9000." })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body // Email yang meminta reset password
    const userAgent = req.get('User-Agent') || ''
    const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|Windows Phone/i.test(userAgent) ||
                     req.headers['x-platform'] === 'mobile'
    const user = await prisma.user.findUnique({
      where: { email }
    }) // Cari user dengan email tersebut

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    const resetToken = generateResetToken() // Token acak untuk tautan reset password
    const resetExpire = addMinutes(new Date(), 60) // Token kedaluwarsa dalam 60 menit

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpire
      }
    })

    await sendResetPasswordEmail(email, resetToken, isMobile)

    res.json({
      message: "Tautan reset password telah dikirim ke email Anda"
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body // Token reset dan password baru dari request

    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetExpire: {
          gte: new Date() // Pastikan token belum kedaluwarsa
        }
      }
    }) // Temukan user berdasarkan token yang masih valid

    if (!user) {
      return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" })
    }

    const hashed = await bcrypt.hash(newPassword, 10) // Hash password baru sebelum disimpan

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetExpire: null
      }
    })

    res.json({
      message: "Password berhasil direset"
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.params.email as string // Email konfirmasi akun yang akan dihapus dari URL param
    const userId = req.user?.id // ID user yang sedang login

    if (!userId) {
      return res.status(401).json({ message: "Tidak diizinkan" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) // Ambil data user berdasarkan ID yang login

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    if (user.email !== email) {
      return res.status(403).json({ message: "Email tidak sesuai dengan akun Anda" })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ message: "Akun berhasil dihapus" })
  } catch (error) {
    console.error("Delete account error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ // Ambil semua user (tanpa password) urut dari terbaru
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    res.json({ users })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.params.email as string // Email user yang akan dihapus dari URL param

    const user = await prisma.user.findUnique({
      where: { email }
    }) // Cari user target berdasarkan email

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Akun admin tidak dapat dihapus" })
    }

    await prisma.user.delete({
      where: { email }
    })

    res.json({ message: "Pengguna berhasil dihapus" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id)

    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID user tidak valid" })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" })
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Akun admin tidak dapat diblokir" })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
      select: { id: true, name: true, email: true, isBlocked: true }
    })

    res.json({
      message: updated.isBlocked ? "Pengguna berhasil diblokir" : "Pemblokiran pengguna berhasil dicabut",
      user: updated
    })
  } catch (error) {
    console.error("Block user error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}