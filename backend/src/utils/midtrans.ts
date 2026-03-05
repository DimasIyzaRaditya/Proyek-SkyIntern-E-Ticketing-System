// Utilitas integrasi payment gateway Midtrans.
// Menyediakan fungsi: createTransaction (membuat Snap token untuk pembayaran),
// checkTransactionStatus (cek status order dari Midtrans),
// verifySignature (validasi tanda tangan webhook), dan
// mapMidtransStatus (mengonversi status Midtrans ke status internal).
import midtransClient from "midtrans-client"

// Create Snap lazily so it reads env vars AFTER dotenv.config() has run
// Factory function agar instance Snap dibuat setelah dotenv.config() selesai membaca .env
const getSnap = () => new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
})

export interface MidtransTransactionParams {
  orderId: string
  amount: number
  customerDetails: {
    first_name: string
    email: string
    phone?: string
  }
  itemDetails: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

/**
 * Create Midtrans Snap transaction
 * Returns snap token and redirect URL
 */
export const createTransaction = async (
  params: MidtransTransactionParams
): Promise<{ token: string; redirectUrl: string }> => {
  try {
    const snap = getSnap() // Instance Snap Midtrans menggunakan konfigurasi dari .env
    const parameter = { // Parameter transaksi lengkap yang dikirim ke Midtrans API
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount
      },
      customer_details: params.customerDetails,
      item_details: params.itemDetails,
      enabled_payments: [
        // Kartu kredit / debit
        "credit_card",
        // Transfer bank virtual account
        "bca_va",
        "bni_va",
        "bri_va",
        "mandiri_bill",
        "permata_va",
        "other_va",
        // E-wallet
        "gopay",
        "shopeepay",
        "qris",
        // Gerai retail
        "indomaret",
        "alfamart",
      ],
      credit_card: {
        secure: true
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/bookings?status=success`,
        error: `${process.env.FRONTEND_URL}/bookings?status=error`,
        pending: `${process.env.FRONTEND_URL}/bookings?status=pending`
      }
    }

    const transaction = await snap.createTransaction(parameter) // Kirim ke Midtrans dan dapatkan token Snap
    
    return {
      token: transaction.token, // Token untuk Midtrans Snap.js di frontend
      redirectUrl: transaction.redirect_url // URL redirect jika tidak menggunakan popup
    }
  } catch (error: any) {
    console.error("Midtrans create transaction error:", error)
    throw new Error(`Gagal membuat pembayaran: ${error.message}`)
  }
}

/**
 * Check transaction status from Midtrans
 */
export const checkTransactionStatus = async (orderId: string) => {
  try {
    const snap = getSnap() // Instance Snap Midtrans
    const statusResponse = await snap.transaction.status(orderId) // Ambil status transaksi dari Midtrans berdasarkan orderId
    return statusResponse
  } catch (error: any) {
    console.error("Midtrans check status error:", error)
    throw new Error(`Gagal memeriksa status pembayaran: ${error.message}`)
  }
}

/**
 * Verify notification signature from Midtrans webhook
 */
export const verifySignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean => {
  const crypto = require("crypto") // Module crypto Node.js untuk hashing SHA512
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "" // Server key Midtrans dari environment variable
  
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`) // Format hash: orderId + statusCode + grossAmount + serverKey
    .digest("hex") // Hasil hash dalam format hexadecimal
  
  return hash === signatureKey // Bandingkan hash lokal dengan signature dari Midtrans
}

/**
 * Map Midtrans transaction status to our payment status
 */
export const mapMidtransStatus = (transactionStatus: string, fraudStatus?: string): string => {
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") {
      return "SUCCESS"
    }
    return "PENDING"
  } else if (transactionStatus === "settlement") {
    return "SUCCESS"
  } else if (transactionStatus === "pending") {
    return "PENDING"
  } else if (
    transactionStatus === "deny" ||
    transactionStatus === "expire" ||
    transactionStatus === "cancel"
  ) {
    return "FAILED"
  }
  return "PENDING"
}

export default {
  createTransaction,
  checkTransactionStatus,
  verifySignature,
  mapMidtransStatus
}
