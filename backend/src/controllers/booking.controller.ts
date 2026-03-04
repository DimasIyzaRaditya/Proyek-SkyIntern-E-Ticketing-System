import { Response } from "express"
import prisma from "../prisma/client"
import { AuthRequest } from "../middleware/auth.middleware"
import { generateBookingCode, generateTicketNumber, calculateTotalPrice, addMinutes } from "../utils/helpers"
import { uploadFile } from "../utils/minio"
import { sendBookingConfirmation } from "../utils/email"
import { createTransaction, checkTransactionStatus, verifySignature, mapMidtransStatus } from "../utils/midtrans"

// Step 1: Create Booking with Passenger Data
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, passengers, seatIds } = req.body
    // passengers: [{ type, title, firstName, lastName, idType, idNumber, nationality, dateOfBirth }]
    // seatIds: [flightSeatId1, flightSeatId2, ...]

    const flight = await prisma.flight.findUnique({
      where: { id: flightId }
    })

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
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
        return res.status(400).json({ message: "Some seats are not available" })
      }
    }

    // Calculate total price
    let seatPrice = 0
    if (seatIds && seatIds.length > 0) {
      const seats = await prisma.flightSeat.findMany({
        where: { id: { in: seatIds } }
      })
      seatPrice = seats.reduce((sum, seat) => sum + seat.additionalPrice, 0)
    }

    const totalPrice = calculateTotalPrice(
      flight.basePrice,
      flight.tax,
      flight.adminFee,
      seatPrice,
      passengers.length
    )

    // Create booking
    const bookingCode = generateBookingCode()
    const expiresAt = addMinutes(new Date(), 15)

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
            idType: p.idType,
            idNumber: p.idNumber,
            nationality: p.nationality,
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
      message: "Booking created successfully",
      booking,
      expiresIn: 15 * 60
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Step 2: Create Payment Transaction (Generate Snap Token)
export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body

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
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking is not pending" })
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

      return res.status(400).json({ message: "Booking has expired" })
    }

    // Check if payment already exists
    if (booking.payment) {
      if (booking.payment.status === "SUCCESS") {
        return res.status(400).json({ message: "Payment already completed" })
      }
    }

    // Create Midtrans transaction
    const orderId = `${booking.bookingCode}-${Date.now()}`
    
    const midtransParams = {
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

    const transaction = await createTransaction(midtransParams)

    // Create or update payment record
    const payment = await prisma.payment.upsert({
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
      message: "Payment transaction created",
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
      message: "Failed to create payment", 
      error: error.message 
    })
  }
}

// Get User Bookings
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query

    const where: any = {
      userId: req.user!.id
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
    })

    res.json({ bookings })
  } catch (error) {
    console.error("Get my bookings error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Admin: Get All Bookings
export const getAllBookingsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query

    const where: any = {}
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
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get Booking Detail
export const getBookingDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id as string) },
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
        ticket: true,
        flightSeats: {
          include: {
            seat: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" })
    }

    res.json({ booking })
  } catch (error) {
    console.error("Get booking detail error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get Ticket
export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const ticket = await prisma.ticket.findUnique({
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
      return res.status(404).json({ message: "Ticket not found" })
    }

    if (ticket.booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" })
    }

    res.json({ ticket })
  } catch (error) {
    console.error("Get ticket error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Cancel Booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id as string) }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    if (booking.status !== "PENDING" && booking.status !== "PAID") {
      return res.status(400).json({ message: "Cannot cancel this booking" })
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

    res.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({ message: "Internal server error" })
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
    )

    if (!isValid) {
      console.error("❌ Invalid signature from Midtrans")
      return res.status(403).json({ message: "Invalid signature" })
    }

    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: { transactionId: order_id },
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
      return res.status(404).json({ message: "Payment not found" })
    }

    // Map Midtrans status to our status
    const paymentStatus = mapMidtransStatus(transaction_status, fraud_status)

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

    res.json({ message: "Notification processed successfully" })
  } catch (error) {
    console.error("❌ Payment notification error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
