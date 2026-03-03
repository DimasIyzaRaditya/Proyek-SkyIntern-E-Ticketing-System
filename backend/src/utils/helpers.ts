import crypto from "crypto"

export const generateBookingCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex")
}

export const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return`TKT${timestamp}${random}`
}

export const calculateTotalPrice = (
  basePrice: number,
  tax: number,
  adminFee: number,
  seatPrice: number = 0,
  passengerCount: number = 1
): number => {
  return (basePrice + seatPrice) * passengerCount + tax + adminFee
}

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000)
}
