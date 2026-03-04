import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { SeatClass } from "@prisma/client"

// Admin: Create Seats for Flight
export const createFlightSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, seats } = req.body

    // Validate flightId
    if (!flightId) {
      return res.status(400).json({ message: "flightId is required" })
    }

    const parsedFlightId = parseInt(flightId)
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId must be a valid number" })
    }

    // Validate seats array
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "seats array is required and must not be empty" })
    }

    // Check if flight exists
    const flight = await prisma.flight.findUnique({
      where: { id: parsedFlightId }
    })
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    // seats: [{ seatNumber, seatClass, isExitRow, additionalPrice }]
    
    const createdSeats = []

    for (const seatData of seats) {
      // Find or create seat
      let seat = await prisma.seat.findFirst({
        where: {
          seatNumber: seatData.seatNumber,
          seatClass: seatData.seatClass
        }
      })

      if (!seat) {
        seat = await prisma.seat.create({
          data: {
            seatNumber: seatData.seatNumber,
            seatClass: seatData.seatClass,
            isExitRow: seatData.isExitRow || false
          }
        })
      }

      // Create flight seat
      const flightSeat = await prisma.flightSeat.create({
        data: {
          flightId: parsedFlightId,
          seatId: seat.id,
          additionalPrice: seatData.additionalPrice || 0
        },
        include: {
          seat: true
        }
      })

      createdSeats.push(flightSeat)
    }

    res.status(201).json({
      message: "Flight seats created successfully",
      seats: createdSeats
    })
  } catch (error: any) {
    console.error("Create seats error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Update Flight Seat
export const updateFlightSeat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, additionalPrice } = req.body

    const flightSeat = await prisma.flightSeat.update({
      where: { id: parseInt(id as string) },
      data: {
        status,
        additionalPrice
      },
      include: {
        seat: true
      }
    })

    res.json({
      message: "Flight seat updated successfully",
      seat: flightSeat
    })
  } catch (error: any) {
    console.error("Update flight seat error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Flight seat not found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

// User: Get Seat Map
export const getSeatMap = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.params

    const flightSeats = await prisma.flightSeat.findMany({
      where: { flightId: parseInt(flightId as string) },
      include: {
        seat: true
      },
      orderBy: {
        seat: {
          seatNumber: "asc"
        }
      }
    })

    // Group by seat class
    const seatMap = {
      ECONOMY: flightSeats.filter(fs => fs.seat.seatClass === "ECONOMY"),
      BUSINESS: flightSeats.filter(fs => fs.seat.seatClass === "BUSINESS"),
      FIRST: flightSeats.filter(fs => fs.seat.seatClass === "FIRST")
    }

    res.json({ seatMap })
  } catch (error) {
    console.error("Get seat map error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Generate Standard Seats for Flight
export const generateStandardSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.body

    // Validate flightId
    if (!flightId) {
      return res.status(400).json({ message: "flightId is required" })
    }

    const parsedFlightId = parseInt(flightId)
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId must be a valid number" })
    }

    // Check if flight exists
    const flight = await prisma.flight.findUnique({
      where: { id: parsedFlightId }
    })
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    const economyRows = 30
    const businessRows = 6
    const seatsPerRow = 6
    const economyExitRows = [12, 13]

    const seats = []

    // Business class: Rows 1-6
    for (let row = 1; row <= businessRows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        const letter = String.fromCharCode(65 + col)
        seats.push({
          seatNumber: `${row}${letter}`,
          seatClass: "BUSINESS",
          isExitRow: false,
          additionalPrice: 500000
        })
      }
    }

    // Economy class: Rows 7-36
    for (let row = businessRows + 1; row <= businessRows + economyRows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        const letter = String.fromCharCode(65 + col)
        const isExitRow = economyExitRows.includes(row - businessRows)
        seats.push({
          seatNumber: `${row}${letter}`,
          seatClass: "ECONOMY",
          isExitRow,
          additionalPrice: isExitRow ? 100000 : 0
        })
      }
    }

    // Create all seats
    const createdSeats = []
    for (const seatData of seats) {
      let seat = await prisma.seat.findFirst({
        where: {
          seatNumber: seatData.seatNumber,
          seatClass: seatData.seatClass as SeatClass
        }
      })

      if (!seat) {
        seat = await prisma.seat.create({
          data: {
            seatNumber: seatData.seatNumber,
            seatClass: seatData.seatClass as SeatClass,
            isExitRow: seatData.isExitRow
          }
        })
      }

      const flightSeat = await prisma.flightSeat.create({
        data: {
          flightId: parsedFlightId,
          seatId: seat.id,
          additionalPrice: seatData.additionalPrice
        },
        include: {
          seat: true
        }
      })

      createdSeats.push(flightSeat)
    }

    res.status(201).json({
      message: "Standard seats generated successfully",
      count: createdSeats.length
    })
  } catch (error: any) {
    console.error("Generate seats error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
