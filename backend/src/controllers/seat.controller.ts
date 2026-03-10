// Controller kursi pesawat (seat). Menangani pembuatan & pembaruan kursi per penerbangan,
// menampilkan denah kursi (seat map) yang dikelompokkan per kelas,
// serta generate otomatis kursi standar (business & economy) untuk suatu penerbangan.
import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { SeatClass } from "@prisma/client"

// Admin: Create Seats for Flight
export const createFlightSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, seats } = req.body // ID penerbangan dan array data kursi dari body request

    // Validate flightId
    if (!flightId) {
      return res.status(400).json({ message: "flightId wajib diisi" })
    }

    const parsedFlightId = parseInt(flightId) // Konversi flightId ke integer
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId harus berupa angka yang valid" })
    }

    // Validate seats array
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Array kursi wajib diisi dan tidak boleh kosong" })
    }

    // Check if flight exists
    const flight = await prisma.flight.findUnique({
      where: { id: parsedFlightId }
    })
    if (!flight) {
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }

    // seats: [{ seatNumber, seatClass, isExitRow, additionalPrice }]
    
    const createdSeats = [] // Koleksi kursi yang berhasil dibuat

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
      message: "Kursi penerbangan berhasil dibuat",
      seats: createdSeats
    })
  } catch (error: any) {
    console.error("Create seats error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Admin: Update Flight Seat
export const updateFlightSeat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID flight seat dari URL param
    const { status, additionalPrice } = req.body // Status baru dan harga tambahan yang diperbarui

    const flightSeat = await prisma.flightSeat.update({ // Perbarui data kursi penerbangan
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
      message: "Kursi penerbangan berhasil diperbarui",
      seat: flightSeat
    })
  } catch (error: any) {
    console.error("Update flight seat error:", error)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Kursi penerbangan tidak ditemukan" })
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// User: Get Seat Map
export const getSeatMap = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.params // ID penerbangan dari URL param

    const flightSeats = await prisma.flightSeat.findMany({
      where: { flightId: parseInt(flightId as string) }, // Ambil semua kursi milik penerbangan ini
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
      ECONOMY: flightSeats.filter(fs => fs.seat.seatClass === "ECONOMY"), // Kursi kelas ekonomi
      BUSINESS: flightSeats.filter(fs => fs.seat.seatClass === "BUSINESS"), // Kursi kelas bisnis
      FIRST: flightSeats.filter(fs => fs.seat.seatClass === "FIRST") // Kursi kelas pertama
    } // Denah kursi dikelompokkan per kelas

    res.json({ seatMap })
  } catch (error) {
    console.error("Get seat map error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Admin: Generate Standard Seats for Flight
export const generateStandardSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.body

    // Validate flightId
    if (!flightId) {
      return res.status(400).json({ message: "flightId wajib diisi" })
    }

    const parsedFlightId = parseInt(flightId)
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId harus berupa angka yang valid" })
    }

    // Check if flight exists
    const flight = await prisma.flight.findUnique({
      where: { id: parsedFlightId }
    })
    if (!flight) {
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }

    const economyRows = 30 // Jumlah baris kelas ekonomi
    const businessRows = 6 // Jumlah baris kelas bisnis
    const seatsPerRow = 6 // Jumlah kursi per baris (A-F)
    const economyExitRows = [12, 13] // Nomor baris exit row di kelas ekonomi (harga tambahan)

    const seats = [] // Array definisi kursi yang akan dibuat

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

      const flightSeat = await prisma.flightSeat.upsert({
        where: {
          flightId_seatId: {
            flightId: parsedFlightId,
            seatId: seat.id,
          },
        },
        update: {
          additionalPrice: seatData.additionalPrice,
        },
        create: {
          flightId: parsedFlightId,
          seatId: seat.id,
          additionalPrice: seatData.additionalPrice,
        },
        include: {
          seat: true,
        },
      })

      createdSeats.push(flightSeat)
    }

    res.status(201).json({
      message: `Kursi standar berhasil dibuat/diperbarui (${createdSeats.length} kursi)`,
      count: createdSeats.length
    })
  } catch (error: any) {
    console.error("Generate seats error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// User: Hold Seats Temporarily (kunci kursi saat memilih di halaman seat selection)
export const holdSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.params
    const { seatIds } = req.body // Array of FlightSeat IDs to hold

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "seatIds wajib diisi" })
    }

    const parsedFlightId = parseInt(flightId as string)
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId tidak valid" })
    }

    // Atomically check availability and hold in a transaction
    await prisma.$transaction(async (tx) => {
      const available = await tx.flightSeat.findMany({
        where: {
          id: { in: seatIds as number[] },
          flightId: parsedFlightId,
          status: "AVAILABLE"
        },
        include: { seat: true }
      })

      if (available.length !== (seatIds as number[]).length) {
        const takenIds = (seatIds as number[]).filter(id => !available.find(s => s.id === id))
        const takenSeats = await tx.flightSeat.findMany({
          where: { id: { in: takenIds } },
          include: { seat: true }
        })
        const takenNumbers = takenSeats.map(s => s.seat.seatNumber)
        throw Object.assign(new Error("SEATS_TAKEN"), { takenNumbers })
      }

      await tx.flightSeat.updateMany({
        where: {
          id: { in: seatIds as number[] },
          flightId: parsedFlightId,
          status: "AVAILABLE"
        },
        data: { status: "RESERVED" }
      })
    })

    res.json({ message: "Kursi berhasil dipesan sementara" })
  } catch (error: any) {
    if (error.message === "SEATS_TAKEN") {
      return res.status(409).json({
        message: `Kursi ${(error.takenNumbers as string[])?.join(", ")} sudah diambil pengguna lain`,
        takenNumbers: error.takenNumbers
      })
    }
    console.error("Hold seats error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// User: Release Held Seats (lepas kunci kursi saat deselect atau keluar halaman)
export const releaseSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId } = req.params
    const { seatIds } = req.body // Array of FlightSeat IDs to release

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "seatIds wajib diisi" })
    }

    const parsedFlightId = parseInt(flightId as string)
    if (isNaN(parsedFlightId)) {
      return res.status(400).json({ message: "flightId tidak valid" })
    }

    // Hanya lepas kursi yang RESERVED tanpa bookingId (hold sementara, bukan booking nyata)
    await prisma.flightSeat.updateMany({
      where: {
        id: { in: seatIds as number[] },
        flightId: parsedFlightId,
        status: "RESERVED",
        bookingId: null
      },
      data: { status: "AVAILABLE" }
    })

    res.json({ message: "Kursi berhasil dilepas" })
  } catch (error) {
    console.error("Release seats error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
