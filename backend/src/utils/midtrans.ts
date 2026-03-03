import midtransClient from "midtrans-client"

// Create Snap lazily so it reads env vars AFTER dotenv.config() has run
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
    const snap = getSnap()
    const parameter = {
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

    const transaction = await snap.createTransaction(parameter)
    
    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    }
  } catch (error: any) {
    console.error("Midtrans create transaction error:", error)
    throw new Error(`Failed to create payment: ${error.message}`)
  }
}

/**
 * Check transaction status from Midtrans
 */
export const checkTransactionStatus = async (orderId: string) => {
  try {
    const snap = getSnap()
    const statusResponse = await snap.transaction.status(orderId)
    return statusResponse
  } catch (error: any) {
    console.error("Midtrans check status error:", error)
    throw new Error(`Failed to check payment status: ${error.message}`)
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
  const crypto = require("crypto")
  const serverKey = process.env.MIDTRANS_SERVER_KEY || ""
  
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex")
  
  return hash === signatureKey
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
