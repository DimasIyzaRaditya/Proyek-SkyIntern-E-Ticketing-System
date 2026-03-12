import { Request, Response } from "express"
import prisma from "../prisma/client"

// Public: get all currently active GLOBAL promos (no specific flight)
export const getActivePromos = async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        flightId: null,   // only global promos
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ promos })
  } catch {
    res.status(500).json({ message: "Gagal memuat promo." })
  }
}

// Admin: get all promos
export const getAllPromos = async (req: Request, res: Response) => {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        flight: {
          select: {
            id: true,
            flightNumber: true,
            origin: { select: { city: true } },
            destination: { select: { city: true } },
          },
        },
      },
    })
    res.json({ promos })
  } catch {
    res.status(500).json({ message: "Gagal memuat promo." })
  }
}

// Admin: create promo
export const createPromo = async (req: Request, res: Response) => {
  try {
    const { title, description, discount, startDate, endDate, isActive, flightId } = req.body as {
      title: string
      description?: string
      discount?: number
      startDate: string
      endDate: string
      isActive?: boolean
      flightId?: number | null
    }

    if (!title || !startDate || !endDate) {
      res.status(400).json({ message: "title, startDate, dan endDate wajib diisi." })
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: "Format tanggal tidak valid." })
      return
    }

    if (end <= start) {
      res.status(400).json({ message: "endDate harus setelah startDate." })
      return
    }

    const promo = await prisma.promo.create({
      data: {
        title,
        description: description ?? null,
        discount: discount ?? 0,
        startDate: start,
        endDate: end,
        isActive: isActive ?? true,
        flightId: flightId ?? null,
      },
    })

    res.status(201).json({ promo })
  } catch {
    res.status(500).json({ message: "Gagal membuat promo." })
  }
}

// Admin: update promo
export const updatePromo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)

    const existing = await prisma.promo.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ message: "Promo tidak ditemukan." })
      return
    }

    const { title, description, discount, startDate, endDate, isActive, flightId } = req.body as {
      title?: string
      description?: string
      discount?: number
      startDate?: string
      endDate?: string
      isActive?: boolean
      flightId?: number | null
    }

    const start = startDate ? new Date(startDate) : existing.startDate
    const end = endDate ? new Date(endDate) : existing.endDate

    if (startDate && isNaN(start.getTime())) {
      res.status(400).json({ message: "Format startDate tidak valid." })
      return
    }
    if (endDate && isNaN(end.getTime())) {
      res.status(400).json({ message: "Format endDate tidak valid." })
      return
    }
    if (end <= start) {
      res.status(400).json({ message: "endDate harus setelah startDate." })
      return
    }

    const promo = await prisma.promo.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        discount: discount !== undefined ? discount : existing.discount,
        startDate: start,
        endDate: end,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        flightId: flightId !== undefined ? flightId : existing.flightId,
      },
    })

    res.json({ promo })
  } catch {
    res.status(500).json({ message: "Gagal memperbarui promo." })
  }
}

// Admin: delete promo
export const deletePromo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.promo.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ message: "Promo tidak ditemukan." })
      return
    }
    await prisma.promo.delete({ where: { id } })
    res.json({ message: "Promo berhasil dihapus." })
  } catch {
    res.status(500).json({ message: "Gagal menghapus promo." })
  }
}
