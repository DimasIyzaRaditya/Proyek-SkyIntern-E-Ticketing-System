import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { Request } from "express"

// Admin: Create Flight
export const createFlight = async (req: AuthRequest, res: Response) => {
  try {
    const {
      flightNumber,
      airlineId,
      originId,
      destinationId,
      departureTime,
      arrivalTime,
      basePrice,
      tax,
      adminFee,
      aircraft,
      facilities,
      rules
    } = req.body

    // Calculate duration in minutes
    const departure = new Date(departureTime)
    const arrival = new Date(arrivalTime)
    const duration = Math.floor((arrival.getTime() - departure.getTime()) / 60000)

    const flight = await prisma.flight.create({
      data: {
        flightNumber,
        airlineId,
        originId,
        destinationId,
        departureTime: departure,
        arrivalTime: arrival,
        duration,
        basePrice,
        tax: tax || 0,
        adminFee: adminFee || 0,
        aircraft,
        facilities,
        rules
      },
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    })

    res.status(201).json({
      message: "Flight created successfully",
      flight
    })
  } catch (error: any) {
    console.error("Create flight error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Flight number already exists" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Get All Flights
export const getAllFlightsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        airline: true,
        origin: true,
        destination: true,
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { departureTime: "desc" }
    })

    res.json({ flights })
  } catch (error) {
    console.error("Get all flights error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Update Flight
export const updateFlight = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const {
      flightNumber,
      airlineId,
      originId,
      destinationId,
      departureTime,
      arrivalTime,
      basePrice,
      tax,
      adminFee,
      aircraft,
      facilities,
      rules,
      status
    } = req.body

    const departure = new Date(departureTime)
    const arrival = new Date(arrivalTime)
    const duration = Math.floor((arrival.getTime() - departure.getTime()) / 60000)

    const flight = await prisma.flight.update({
      where: { id: parseInt(id as string) },
      data: {
        flightNumber,
        airlineId,
        originId,
        destinationId,
        departureTime: departure,
        arrivalTime: arrival,
        duration,
        basePrice,
        tax,
        adminFee,
        aircraft,
        facilities,
        rules,
        status
      },
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    })

    res.json({
      message: "Flight updated successfully",
      flight
    })
  } catch (error: any) {
    console.error("Update flight error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Flight not found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Delete Flight
export const deleteFlight = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.flight.delete({
      where: { id: parseInt(id as string) }
    })

    res.json({ message: "Flight deleted successfully" })
  } catch (error: any) {
    console.error("Delete flight error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Flight not found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}

// User: Search Flights
export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      originId,
      destinationId,
      departureDate,
      passengerCount,
      sortBy,
      minPrice,
      maxPrice,
      departureTimeStart,
      departureTimeEnd
    } = req.query

    const where: any = {
      status: "SCHEDULED"
    }

    if (originId) where.originId = parseInt(originId as string)
    if (destinationId) where.destinationId = parseInt(destinationId as string)

    if (departureDate) {
      const date = new Date(departureDate as string)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      where.departureTime = {
        gte: date,
        lt: nextDate
      }
    }

    if (minPrice || maxPrice) {
      where.basePrice = {}
      if (minPrice) where.basePrice.gte = parseInt(minPrice as string)
      if (maxPrice) where.basePrice.lte = parseInt(maxPrice as string)
    }

    if (departureTimeStart && departureTimeEnd) {
      const startTime = new Date(departureTimeStart as string)
      const endTime = new Date(departureTimeEnd as string)
      where.departureTime = {
        ...where.departureTime,
        gte: startTime,
        lte: endTime
      }
    }

    let orderBy: any = { departureTime: "asc" }

    if (sortBy === "price-asc") {
      orderBy = { basePrice: "asc" }
    } else if (sortBy === "price-desc") {
      orderBy = { basePrice: "desc" }
    } else if (sortBy === "duration-asc") {
      orderBy = { duration: "asc" }
    } else if (sortBy === "duration-desc") {
      orderBy = { duration: "desc" }
    }

    const flights = await prisma.flight.findMany({
      where,
      include: {
        airline: {
          select: {
            id: true,
            code: true,
            name: true,
            logo: true
          }
        },
        origin: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true
          }
        },
        destination: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true
          }
        },
        _count: {
          select: {
            flightSeats: {
              where: {
                status: "AVAILABLE"
              }
            }
          }
        }
      },
      orderBy
    })

    res.json({
      flights,
      count: flights.length,
      passengers: passengerCount ? parseInt(passengerCount as string) : 1
    })
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// User: Get Flight Detail
export const getFlightDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const flight = await prisma.flight.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        airline: true,
        origin: true,
        destination: true,
        flightSeats: {
          include: {
            seat: true
          },
          orderBy: {
            seat: {
              seatNumber: "asc"
            }
          }
        }
      }
    })

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    res.json({ flight })
  } catch (error) {
    console.error("Get flight detail error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
