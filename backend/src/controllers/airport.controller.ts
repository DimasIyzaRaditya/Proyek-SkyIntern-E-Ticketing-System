import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"

// Airport Management
export const createAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { name, city, country, timezone } = req.body

    const airport = await prisma.airport.create({
      data: { name, city, country, timezone }
    })

    res.status(201).json({
      message: "Airport created successfully",
      airport
    })
  } catch (error: any) {
    console.error("Create airport error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Airport code already exists" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAllAirports = async (req: AuthRequest, res: Response) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { name: "asc" }
    })

    res.json({ airports })
  } catch (error) {
    console.error("Get all airports error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const airport = await prisma.airport.findUnique({
      where: { id: parseInt(id as string) }
    })

    if (!airport) {
      return res.status(404).json({ message: "Airport not found" })
    }

    res.json({ airport })
  } catch (error) {
    console.error("Get airport error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, city, country, timezone } = req.body

    const airport = await prisma.airport.update({
      where: { id: parseInt(id as string) },
      data: { name, city, country, timezone }
    })

    res.json({
      message: "Airport updated successfully",
      airport
    })
  } catch (error: any) {
    console.error("Update airport error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Airport not found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteAirport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.airport.delete({
      where: { id: parseInt(id as string) }
    })

    res.json({ message: "Airport deleted successfully" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Airport not found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}
