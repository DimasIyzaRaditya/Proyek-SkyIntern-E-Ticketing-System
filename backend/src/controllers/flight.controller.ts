// Controller penerbangan (flight). Menyediakan CRUD penerbangan untuk admin
// serta fitur pencarian penerbangan publik dengan filter asal, tujuan,
// tanggal keberangkatan, harga, dan pengurutan hasil.
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
    } = req.body // Data penerbangan dari body request

    // Validate required fields
    if (!flightNumber || !airlineId || !originId || !destinationId || !departureTime || !arrivalTime || !basePrice) {
      return res.status(400).json({ message: "Field yang diperlukan belum diisi" })
    }

    // Convert string IDs to integers
    const parsedAirlineId = parseInt(airlineId) // Konversi string ID maskapai ke integer
    const parsedOriginId = parseInt(originId) // Konversi string ID bandara asal ke integer
    const parsedDestinationId = parseInt(destinationId) // Konversi string ID bandara tujuan ke integer

    if (isNaN(parsedAirlineId) || isNaN(parsedOriginId) || isNaN(parsedDestinationId)) {
      return res.status(400).json({ message: "airlineId, originId, dan destinationId harus berupa angka yang valid" })
    }

    // Validate that airline, origin, and destination exist
    const [airline, origin, destination] = await Promise.all([
      prisma.airline.findUnique({ where: { id: parsedAirlineId } }),
      prisma.airport.findUnique({ where: { id: parsedOriginId } }),
      prisma.airport.findUnique({ where: { id: parsedDestinationId } })
    ]) // Validasi maskapai, bandara asal, dan bandara tujuan secara paralel

    if (!airline) {
      return res.status(404).json({ message: "Maskapai tidak ditemukan" })
    }
    if (!origin) {
      return res.status(404).json({ message: "Bandara asal tidak ditemukan" })
    }
    if (!destination) {
      return res.status(404).json({ message: "Bandara tujuan tidak ditemukan" })
    }

    // Calculate duration in minutes
    const departure = new Date(departureTime) // Waktu keberangkatan dalam format Date
    const arrival = new Date(arrivalTime) // Waktu kedatangan dalam format Date
    const duration = Math.floor((arrival.getTime() - departure.getTime()) / 60000) // Durasi penerbangan dalam menit

    const flight = await prisma.flight.create({ // Simpan data penerbangan ke database
      data: {
        flightNumber,
        airlineId: parsedAirlineId,
        originId: parsedOriginId,
        destinationId: parsedDestinationId,
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
      message: "Penerbangan berhasil dibuat",
      flight
    })
  } catch (error: any) {
    console.error("Create flight error:", error)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Nomor penerbangan sudah digunakan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
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
    }) // Ambil semua penerbangan beserta relasi maskapai, bandara, dan jumlah booking

    res.json({ flights })
  } catch (error) {
    console.error("Get all flights error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Admin: Update Flight
export const updateFlight = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID penerbangan dari URL param
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
    } = req.body // Field penerbangan yang diperbarui

    // Convert string IDs to integers if provided
    const parsedAirlineId = airlineId ? parseInt(airlineId) : undefined // ID maskapai baru (jika ada)
    const parsedOriginId = originId ? parseInt(originId) : undefined // ID bandara asal baru (jika ada)
    const parsedDestinationId = destinationId ? parseInt(destinationId) : undefined // ID bandara tujuan baru (jika ada)

    if ((airlineId && isNaN(parsedAirlineId!)) || (originId && isNaN(parsedOriginId!)) || (destinationId && isNaN(parsedDestinationId!))) {
      return res.status(400).json({ message: "airlineId, originId, dan destinationId harus berupa angka yang valid" })
    }

    const departure = new Date(departureTime)
    const arrival = new Date(arrivalTime)
    const duration = Math.floor((arrival.getTime() - departure.getTime()) / 60000)

    const flight = await prisma.flight.update({
      where: { id: parseInt(id as string) },
      data: {
        flightNumber,
        airlineId: parsedAirlineId,
        originId: parsedOriginId,
        destinationId: parsedDestinationId,
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
      message: "Penerbangan berhasil diperbarui",
      flight
    })
  } catch (error: any) {
    console.error("Update flight error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Admin: Delete Flight
export const deleteFlight = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.flight.delete({
      where: { id: parseInt(id as string) }
    })

    res.json({ message: "Penerbangan berhasil dihapus" })
  } catch (error: any) {
    console.error("Delete flight error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
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
      status: "SCHEDULED" // Hanya tampilkan penerbangan yang dijadwalkan
    }

    if (originId) where.originId = parseInt(originId as string) // Filter berdasarkan bandara asal
    if (destinationId) where.destinationId = parseInt(destinationId as string) // Filter berdasarkan bandara tujuan

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

    let orderBy: any = { departureTime: "asc" } // Default urutan: paling awal berangkat

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
      where, // Filter yang sudah dibangun dari query params
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
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// User: Get Flight Detail
export const getFlightDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params // ID penerbangan dari URL param

    const flight = await prisma.flight.findUnique({ // Cari detail penerbangan beserta kursi-kursinya
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
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }

    res.json({ flight })
  } catch (error) {
    console.error("Get flight detail error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
