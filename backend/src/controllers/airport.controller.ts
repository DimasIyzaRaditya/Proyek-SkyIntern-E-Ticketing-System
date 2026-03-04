import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { Request } from "express"

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

const deriveAirportCode = (airport: { id: number; name: string; city: string }) => {
  const normalized = `${airport.name} ${airport.city}`.toLowerCase()
  const alias = airportCodeAliases.find((item) => normalized.includes(item.keyword))
  if (alias) return alias.code

  const onlyLetters = airport.city.replace(/[^a-zA-Z]/g, "").toUpperCase()
  const cityCode = onlyLetters.slice(0, 3)
  if (cityCode.length === 3) return cityCode

  return `APT${airport.id}`
}

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

export const getPublicAirportOptions = async (req: Request, res: Response) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { city: "asc" }
    })

    const options = airports.map((airport) => {
      const code = deriveAirportCode(airport)

      return {
        id: airport.id,
        code,
        city: airport.city,
        country: airport.country,
        airportName: airport.name,
        label: `${airport.city}, ${airport.country} (${code})`
      }
    })

    res.json({ airports: options })
  } catch (error) {
    console.error("Get public airport options error:", error)
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
