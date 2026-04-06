import prisma from "../prisma/client"

export const expirePendingBookings = async (userId?: number): Promise<number> => {
  const now = new Date()

  const expired = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(userId ? { userId } : {}),
    },
    select: { id: true },
  })

  if (expired.length === 0) return 0

  const bookingIds = expired.map((item) => item.id)

  await prisma.booking.updateMany({
    where: { id: { in: bookingIds } },
    data: { status: "CANCELLED" },
  })

  await prisma.flightSeat.updateMany({
    where: { bookingId: { in: bookingIds } },
    data: { status: "AVAILABLE", bookingId: null },
  })

  return bookingIds.length
}

export const startBookingExpiryScheduler = () => {
  const intervalMs = 30 * 1000

  setInterval(() => {
    void expirePendingBookings().catch((error) => {
      console.error("Booking expiry scheduler error:", error)
    })
  }, intervalMs)
}
