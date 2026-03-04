import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Request, Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { generateResetToken, addMinutes } from "../utils/helpers"
import { sendResetPasswordEmail } from "../utils/email"

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, name, password: hashed }
    })

    res.status(201).json({
      message: "Register success",
      user
    })

  } catch (error: any) {
    console.error("Register error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Email or name already exists"
      })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return res.status(401).json({ message: "Wrong password" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    )

    res.json({
      message: "Login success",
      token
    })

  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHeader.substring(7)

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

    res.json({
      message: "Token is valid",
      decoded
    })

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }
    console.error("Verify token error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
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
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatarUrl } = req.body

    const data: any = {}
    if (typeof name === "string") data.name = name
    if (typeof phone === "string") data.phone = phone
    if (avatarUrl === null || typeof avatarUrl === "string") data.avatarUrl = avatarUrl

    const user = await prisma.user.update({
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
      message: "Profile updated successfully",
      user
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const resetToken = generateResetToken()
    const resetExpire = addMinutes(new Date(), 60)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpire
      }
    })

    await sendResetPasswordEmail(email, resetToken)

    res.json({
      message: "Password reset link sent to your email"
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body

    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetExpire: {
          gte: new Date()
        }
      }
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" })
    }

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetExpire: null
      }
    })

    res.json({
      message: "Password reset successfully"
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.params.email as string
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.email !== email) {
      return res.status(403).json({ message: "Email does not match your account" })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    res.json({ users })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.params.email as string

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Cannot delete admin account" })
    }

    await prisma.user.delete({
      where: { email }
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}