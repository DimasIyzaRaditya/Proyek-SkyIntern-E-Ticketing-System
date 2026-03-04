import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { uploadFile, deleteFile } from "../utils/minio"

export const createAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, country } = req.body
    const file = req.file

    if (!code || !name || !country) {
      return res.status(400).json({ message: "Code, name, and country are required" })
    }

    let logoUrl: string | undefined

    if (file) {
      const fileName = `airlines/${code}-${Date.now()}.${file.mimetype.split("/")[1]}`
      logoUrl = await uploadFile(fileName, file.buffer, file.mimetype)
    }

    const airline = await prisma.airline.create({
      data: {
        code,
        name,
        country,
        logo: logoUrl
      }
    })

    res.status(201).json({
      message: "Airline created successfully",
      airline
    })
  } catch (error: any) {
    console.error("Create airline error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Airline code already exists" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAllAirlines = async (req: AuthRequest, res: Response) => {
  try {
    const airlines = await prisma.airline.findMany({
      orderBy: { name: "asc" }
    })

    res.json({ airlines })
  } catch (error) {
    console.error("Get all airlines error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const airline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    })

    if (!airline) {
      return res.status(404).json({ message: "Airline not found" })
    }

    res.json({ airline })
  } catch (error) {
    console.error("Get airline error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { code, name, country } = req.body
    const file = req.file

    if (!code || !name || !country) {
      return res.status(400).json({ message: "Code, name, and country are required" })
    }

    const existingAirline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    })

    if (!existingAirline) {
      return res.status(404).json({ message: "Airline not found" })
    }

    let logoUrl = existingAirline.logo

    if (file) {
      // Delete old logo if exists
      if (existingAirline.logo) {
        try {
          const oldFileName = existingAirline.logo.split("/").pop()
          if (oldFileName) {
            await deleteFile(`airlines/${oldFileName}`)
          }
        } catch (error) {
          console.error("Error deleting old logo:", error)
        }
      }

      // Upload new logo
      const fileName = `airlines/${code}-${Date.now()}.${file.mimetype.split("/")[1]}`
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
      message: "Airline updated successfully",
      airline
    })
  } catch (error: any) {
    console.error("Update airline error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteAirline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const airline = await prisma.airline.findUnique({
      where: { id: parseInt(id as string) }
    })

    if (!airline) {
      return res.status(404).json({ message: "Airline not found" })
    }

    // Delete logo from Minio
    if (airline.logo) {
      try {
        const fileName = airline.logo.split("/").pop()
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

    res.json({ message: "Airline deleted successfully" })
  } catch (error: any) {
    console.error("Delete airline error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
