import prisma from "../prisma/client"
import { sendDepartureReminderEmail } from "./email"

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 30 * 60 * 1000

let reminderJobRunning = false

const runDepartureReminderJob = async () => {
  if (reminderJobRunning) return
  reminderJobRunning = true

  try {
    const now = new Date()
    const inOneDay = new Date(now.getTime() + ONE_DAY_MS)

    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
        departureReminderSentAt: null,
        flight: {
          departureTime: {
            gt: now,
            lte: inOneDay
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        flight: {
          select: {
            flightNumber: true,
            departureTime: true,
            airline: {
              select: {
                name: true
              }
            },
            origin: {
              select: {
                city: true
              }
            },
            destination: {
              select: {
                city: true
              }
            }
          }
        }
      }
    })

    if (bookings.length === 0) return

    for (const booking of bookings) {
      const sent = await sendDepartureReminderEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingCode: booking.bookingCode,
        flightNumber: booking.flight.flightNumber,
        airlineName: booking.flight.airline.name,
        originCity: booking.flight.origin.city,
        destinationCity: booking.flight.destination.city,
        departureTime: booking.flight.departureTime
      })

      if (!sent) continue

      await prisma.booking.update({
        where: { id: booking.id },
        data: { departureReminderSentAt: new Date() }
      })
    }
  } catch (error) {
    console.error("Departure reminder scheduler error:", error)
  } finally {
    reminderJobRunning = false
  }
}

export const startDepartureReminderScheduler = () => {
  void runDepartureReminderJob()
  setInterval(() => {
    void runDepartureReminderJob()
  }, CHECK_INTERVAL_MS)

  console.log("Departure reminder scheduler started (every 30 minutes)")
}
