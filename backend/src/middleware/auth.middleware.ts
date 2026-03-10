// Middleware autentikasi JWT. Fungsi `authenticate` memvalidasi Bearer token dari header
// Authorization dan menyisipkan data user ke request. Fungsi `isAdmin` memastikan user
// memiliki role ADMIN sebelum mengakses route admin.
import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import prisma from "../prisma/client"

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role?: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization // Header Authorization dari request HTTP

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token tidak ditemukan" })
    }

    const token = authHeader.substring(7) // JWT token setelah menghapus prefix "Bearer "
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any // Hasil decode JWT berisi id, email, role

    req.user = {
      id: Number(decoded.id),
      email: decoded.email,
      role: decoded.role
    }

    // Block check: reject requests from blocked users
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isBlocked: true }
    })
    if (dbUser?.isBlocked) {
      return res.status(403).json({ message: "Akun Anda telah diblokir oleh admin." })
    }

    next()
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token telah kedaluwarsa" })
    }
    return res.status(401).json({ message: "Token tidak valid" })
  }
}

export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Akses admin diperlukan" })
  }
  next()
}
