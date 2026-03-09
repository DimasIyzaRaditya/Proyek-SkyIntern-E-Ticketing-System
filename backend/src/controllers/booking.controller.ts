// Controller pemesanan tiket. Mengelola alur lengkap booking:
// membuat pesanan (step 1), memproses pembayaran via Midtrans Snap (step 2),
// menerima notifikasi webhook pembayaran, serta melihat, membatalkan,
// dan mengunduh tiket untuk user maupun admin.
import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { generateBookingCode, generateTicketNumber, calculateTotalPrice, addMinutes } from "../utils/helpers"
import { uploadFile, deleteFile } from "../utils/minio"
import { sendBookingConfirmation } from "../utils/email"
import { createTransaction, checkTransactionStatus, verifySignature, mapMidtransStatus } from "../utils/midtrans"

// Step 1: Create Booking with Passenger Data
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, passengers, seatIds } = req.body // ID penerbangan, data penumpang, dan ID kursi yang dipilih
    // passengers: [{ type, title, firstName, lastName, documentType, documentNumber, nationality, dateOfBirth }]
    // documentType: 'KTP' atau 'PASSPORT'
    // seatIds: [flightSeatId1, flightSeatId2, ...]

    const flight = await prisma.flight.findUnique({
      where: { id: flightId }
    })

    if (!flight) {
      return res.status(404).json({ message: "Penerbangan tidak ditemukan" })
    }

    // Check seat availability
    if (seatIds && seatIds.length > 0) {
      const seats = await prisma.flightSeat.findMany({
        where: {
          id: { in: seatIds },
          status: "AVAILABLE"
        }
      })

      if (seats.length !== seatIds.length) {
        return res.status(400).json({ message: "Beberapa kursi tidak tersedia" })
      }
    }

    // Calculate total price
    let seatPrice = 0 // Total harga tambahan dari kursi yang dipilih
    if (seatIds && seatIds.length > 0) {
      const seats = await prisma.flightSeat.findMany({
        where: { id: { in: seatIds } }
      }) // Ambil data kursi terpilih untuk menghitung harga tambahan
      seatPrice = seats.reduce((sum, seat) => sum + seat.additionalPrice, 0) // Jumlah seluruh harga tambahan kursi
    }

    const totalPrice = calculateTotalPrice( // Hitung total harga: (base + seat) x penumpang + pajak + admin fee
      flight.basePrice,
      flight.tax,
      flight.adminFee,
      seatPrice,
      passengers.length
    )

    // Create booking
    const bookingCode = generateBookingCode() // Kode booking 6 karakter unik (A-Z0-9)
    const expiresAt = addMinutes(new Date(), 15) // Booking kedaluwarsa dalam 15 menit jika belum dibayar

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        userId: req.user!.id,
        flightId,
        totalPrice,
        expiresAt,
        status: "PENDING",
        passengers: {
          create: passengers.map((p: any) => ({
            type: p.type,
            title: p.title,
            firstName: p.firstName,
            lastName: p.lastName,
            documentType: p.documentType || p.idType || "KTP",
            documentNumber: p.documentNumber || p.idNumber || "0000000000000000",
            nationality: p.nationality || "Indonesian",
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : undefined
          }))
        }
      },
      include: {
        flight: {
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        passengers: true
      }
    })

    // Update selected seats
    if (seatIds && seatIds.length > 0) {
      await prisma.flightSeat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: "RESERVED",
          bookingId: booking.id
        }
      })
    }

    res.status(201).json({
      message: "Pemesanan berhasil dibuat",
      booking,
      expiresIn: 15 * 60
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Step 2: Create Payment Transaction (Generate Snap Token)
export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true, // Cek apakah sudah ada record pembayaran sebelumnya
        flight: {
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        user: true,
        passengers: true
      }
    })

    if (!booking) {
      return res.status(404).json({ message: "Pemesanan tidak ditemukan" })
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Tidak diizinkan" })
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Pemesanan bukan dalam status menunggu" })
    }

    // Check if booking expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
      })

      // Release seats
      await prisma.flightSeat.updateMany({
        where: { bookingId: booking.id },
        data: { status: "AVAILABLE", bookingId: null }
      })

      return res.status(400).json({ message: "Pemesanan telah kedaluwarsa" })
    }

    // Check if payment already exists
    if (booking.payment) {
      if (booking.payment.status === "SUCCESS") {
        return res.status(400).json({ message: "Pembayaran sudah selesai" })
      }
    }

    // Create Midtrans transaction
    const orderId = `${booking.bookingCode}-${Date.now()}` // ID unik transaksi Midtrans (kode booking + timestamp)
    
    const midtransParams = { // Parameter yang dikirim ke Midtrans Snap API
      orderId,
      amount: booking.totalPrice,
      customerDetails: {
        first_name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone || ""
      },
      itemDetails: [
        {
          id: booking.flight.flightNumber,
          name: `Flight ${booking.flight.origin.city} → ${booking.flight.destination.city}`,
          price: booking.totalPrice,
          quantity: 1
        }
      ]
    }

    const transaction = await createTransaction(midtransParams) // Buat transaksi Midtrans, dapatkan token Snap & redirect URL

    // Create or update payment record
    const payment = await prisma.payment.upsert({ // Simpan atau perbarui record pembayaran
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        method: "MIDTRANS",
        status: "PENDING",
        amount: booking.totalPrice,
        transactionId: orderId
      },
      update: {
        transactionId: orderId,
        status: "PENDING"
      }
    })

    res.json({
      message: "Transaksi pembayaran berhasil dibuat",
      payment: {
        orderId,
        amount: booking.totalPrice,
        snapToken: transaction.token,
        redirectUrl: transaction.redirectUrl
      }
    })
  } catch (error: any) {
    console.error("Payment error:", error)
    res.status(500).json({ 
      message: "Gagal membuat pembayaran", 
      error: error.message 
    })
  }
}

// Get User Bookings
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query // Filter status booking (PENDING/PAID/CANCELLED) dari query string

    const where: any = {
      userId: req.user!.id // Hanya tampilkan booking milik user yang login
    }

    if (status) {
      where.status = status as string
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        flight: {
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        passengers: true,
        payment: true,
        ticket: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }) // Ambil booking user beserta detail penerbangan, penumpang, pembayaran, dan tiket

    res.json({ bookings })
  } catch (error) {
    console.error("Get my bookings error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Admin: Get All Bookings
export const getAllBookingsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query // Filter status booking dari query string (opsional)

    const where: any = {} // Kondisi filter, kosong berarti tampilkan semua booking
    if (status) {
      where.status = status as string
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        flight: {
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        passengers: true,
        payment: true,
        ticket: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json({ bookings })
  } catch (error) {
    console.error("Get all bookings admin error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Get Booking Detail
export const getBookingDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID booking dari URL param

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        flight: { // Ambil detail booking lengkap termasuk kursi
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        passengers: true,
        payment: true,
        ticket: true,
        flightSeats: {
          include: {
            seat: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ message: "Pemesanan tidak ditemukan" })
    }

    if (booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Tidak diizinkan" })
    }

    res.json({ booking })
  } catch (error) {
    console.error("Get booking detail error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Get Ticket
export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID tiket dari URL param

    const ticket = await prisma.ticket.findUnique({ // Ambil tiket beserta data booking lengkap
      where: { id: parseInt(id as string) },
      include: {
        booking: {
          include: {
            flight: {
              include: {
                airline: true,
                origin: true,
                destination: true
              }
            },
            passengers: true,
            user: true,
            flightSeats: {
              include: {
                seat: true
              }
            }
          }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({ message: "Tiket tidak ditemukan" })
    }

    if (ticket.booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Tidak diizinkan" })
    }

    res.json({ ticket })
  } catch (error) {
    console.error("Get ticket error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Cancel Booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params // ID booking dari URL param

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id as string) }
    }) // Cari booking yang akan dibatalkan

    if (!booking) {
      return res.status(404).json({ message: "Pemesanan tidak ditemukan" })
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Tidak diizinkan" })
    }

    if (booking.status !== "PENDING" && booking.status !== "PAID") {
      return res.status(400).json({ message: "Pemesanan ini tidak dapat dibatalkan" })
    }

    // Update booking
    await prisma.booking.update({
      where: { id: parseInt(id as string) },
      data: { status: "CANCELLED" }
    })

    // Release seats
    await prisma.flightSeat.updateMany({
      where: { bookingId: parseInt(id as string) },
      data: { status: "AVAILABLE", bookingId: null }
    })

    res.json({ message: "Pemesanan berhasil dibatalkan" })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Midtrans Payment Notification Webhook
export const paymentNotification = async (req: any, res: Response) => {
  try {
    const notification = req.body

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key
    } = notification

    console.log("📥 Payment notification received:", {
      order_id,
      transaction_status,
      fraud_status
    })

    // Verify signature
    const isValid = verifySignature(
      order_id,
      notification.status_code,
      gross_amount,
      signature_key
    ) // Validasi tanda tangan webhook dari Midtrans agar tidak bisa dipalsukan

    if (!isValid) {
      console.error("❌ Invalid signature from Midtrans")
      return res.status(403).json({ message: "Tanda tangan tidak valid" })
    }

    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: { transactionId: order_id }, // Cari record pembayaran berdasarkan order ID Midtrans
      include: {
        booking: {
          include: {
            flight: {
              include: {
                airline: true,
                origin: true,
                destination: true
              }
            },
            user: true,
            passengers: true
          }
        }
      }
    })

    if (!payment) {
      console.error("❌ Payment not found for order:", order_id)
      return res.status(404).json({ message: "Pembayaran tidak ditemukan" })
    }

    // Map Midtrans status to our status
    const paymentStatus = mapMidtransStatus(transaction_status, fraud_status) // Konversi status Midtrans ke status internal (SUCCESS/PENDING/FAILED)

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus as any,
        paidAt: paymentStatus === "SUCCESS" ? new Date() : null
      }
    })

    // If payment successful, update booking and generate ticket
    if (paymentStatus === "SUCCESS") {
      console.log("✅ Payment successful for booking:", payment.booking.bookingCode)

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "PAID" }
      })

      // Update seat status
      await prisma.flightSeat.updateMany({
        where: { bookingId: payment.bookingId },
        data: { status: "BOOKED" }
      })

      // Check if ticket already exists
      const existingTicket = await prisma.ticket.findUnique({
        where: { bookingId: payment.bookingId }
      })

      if (!existingTicket) {
        // Generate ticket
        const ticketNumber = generateTicketNumber()
        const qrData = JSON.stringify({
          ticketNumber,
          bookingCode: payment.booking.bookingCode,
          passengers: payment.booking.passengers.length,
          flight: payment.booking.flight.flightNumber
        })

        const ticket = await prisma.ticket.create({
          data: {
            bookingId: payment.bookingId,
            ticketNumber,
            qrCode: qrData
          }
        })

        try {
          // Send confirmation email
          await sendBookingConfirmation(
            payment.booking.user.email,
            payment.booking.bookingCode,
            `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          )
          console.log("📧 Confirmation email sent to:", payment.booking.user.email)
        } catch (emailError) {
          console.error("❌ Email send error:", emailError)
        }
      }
    } else if (paymentStatus === "FAILED") {
      console.log("❌ Payment failed for booking:", payment.booking.bookingCode)

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CANCELLED" }
      })

      // Release seats
      await prisma.flightSeat.updateMany({
        where: { bookingId: payment.bookingId },
        data: { status: "AVAILABLE", bookingId: null }
      })
    }

    res.json({ message: "Notifikasi berhasil diproses" })
  } catch (error) {
    console.error("❌ Payment notification error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}

// Sync Payment Status: cek status aktual ke Midtrans dan update booking
export const syncPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id as string)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        flight: {
          include: {
            airline: true,
            origin: true,
            destination: true
          }
        },
        user: true,
        passengers: true
      }
    })

    if (!booking) {
      return res.status(404).json({ message: "Pemesanan tidak ditemukan" })
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Tidak diizinkan" })
    }

    if (!booking.payment?.transactionId) {
      return res.status(400).json({ message: "Belum ada transaksi pembayaran untuk booking ini" })
    }

    // Tanya langsung ke Midtrans
    let midtransStatus: any
    try {
      midtransStatus = await checkTransactionStatus(booking.payment.transactionId)
    } catch (midtransError: any) {
      // 404 = user belum pernah mulai bayar lewat Snap (token dibuat tapi popup ditutup)
      const is404 =
        midtransError?.ApiResponse?.status_code === "404" ||
        midtransError?.httpStatusCode === "404" ||
        midtransError?.message?.includes("404")
      if (is404) {
        return res.json({ message: "Pembayaran belum dimulai. Silakan klik Bayar Sekarang.", status: booking.status })
      }
      throw midtransError
    }
    const paymentStatus = mapMidtransStatus(
      midtransStatus.transaction_status,
      midtransStatus.fraud_status
    )

    // Update payment status
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: paymentStatus as any,
        paidAt: paymentStatus === "SUCCESS" ? new Date() : undefined
      }
    })

    if (paymentStatus === "SUCCESS" && booking.status === "PENDING") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "PAID" }
      })

      await prisma.flightSeat.updateMany({
        where: { bookingId },
        data: { status: "BOOKED" }
      })

      const existingTicket = await prisma.ticket.findUnique({
        where: { bookingId }
      })

      if (!existingTicket) {
        const ticketNumber = generateTicketNumber()
        const qrData = JSON.stringify({
          ticketNumber,
          bookingCode: booking.bookingCode,
          passengers: booking.passengers.length,
          flight: booking.flight.flightNumber
        })

        const ticket = await prisma.ticket.create({
          data: { bookingId, ticketNumber, qrCode: qrData }
        })

        try {
          await sendBookingConfirmation(
            booking.user.email,
            booking.bookingCode,
            `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          )
        } catch { /* silent */ }
      }

      return res.json({ message: "Pembayaran dikonfirmasi. Booking sekarang berstatus PAID.", status: "PAID" })
    }

    if (paymentStatus === "FAILED" && booking.status === "PENDING") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
      })
      await prisma.flightSeat.updateMany({
        where: { bookingId },
        data: { status: "AVAILABLE", bookingId: null }
      })
      return res.json({ message: "Pembayaran gagal. Booking dibatalkan.", status: "CANCELLED" })
    }

    res.json({ message: "Status sudah sinkron.", status: booking.status })
  } catch (error: any) {
    console.error("Sync payment status error:", error)
    res.status(500).json({ message: "Gagal memeriksa status pembayaran", error: error.message })
  }
}

// Upload gambar dokumen identitas penumpang (KTP/Paspor) ke MinIO
export const uploadPassengerDocument = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = parseInt(String(req.params.passengerId)) // ID penumpang dari URL param (cast ke string terlebih dahulu)
    const file = req.file // File gambar yang di-upload via multipart/form-data

    if (!file) {
      return res.status(400).json({ message: "File gambar dokumen wajib diunggah" })
    }

    // Cari penumpang beserta data booking untuk verifikasi kepemilikan
    const passenger = await prisma.passenger.findUnique({
      where: { id: passengerId },
      include: { booking: true }
    })

    if (!passenger) {
      return res.status(404).json({ message: "Data penumpang tidak ditemukan" })
    }

    // Pastikan penumpang ini milik user yang sedang login
    if (passenger.booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Tidak diizinkan mengakses data penumpang ini" })
    }

    // Hapus gambar lama dari MinIO jika sudah ada
    if (passenger.documentImageUrl) {
      const oldFileName = passenger.documentImageUrl.split("/").pop()! // Ambil nama file dari URL lama
      await deleteFile(`passengers/${oldFileName}`).catch(() => {}) // Abaikan error jika file tidak ada
    }

    // Generate nama file unik: passengers/passengerId-timestamp.ext
    const ext = file.mimetype.split("/")[1] || "jpg" // Ekstensi file dari MIME type
    const fileName = `passengers/${passengerId}-${Date.now()}.${ext}` // Nama file unik di MinIO
    const imageUrl = await uploadFile(fileName, file.buffer, file.mimetype) // Upload ke MinIO, return URL

    // Simpan URL gambar ke database
    const updated = await prisma.passenger.update({
      where: { id: passengerId },
      data: { documentImageUrl: imageUrl }
    })

    res.json({
      message: "Gambar dokumen berhasil diunggah",
      documentImageUrl: updated.documentImageUrl
    })
  } catch (error) {
    console.error("Upload passenger document error:", error)
    res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
