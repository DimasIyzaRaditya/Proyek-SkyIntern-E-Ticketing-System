// Fungsi-fungsi helper umum:
// - generateBookingCode: kode booking 6 karakter acak (A-Z0-9)
// - generateResetToken: token reset password berbasis crypto random
// - generateTicketNumber: nomor tiket unik berformat TKT+timestamp+random
// - calculateTotalPrice: menghitung total harga tiket termasuk pajak & biaya admin
// - addMinutes: menambahkan menit ke objek Date
import crypto from "crypto"

export const generateBookingCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" // Kumpulan karakter yang digunakan dalam kode booking
  let code = "" // Kode booking yang sedang dibangun karakter per karakter
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex")
}

export const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8) // 8 digit terakhir timestamp saat ini
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0") // 4 digit angka acak (0000-9999)
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
