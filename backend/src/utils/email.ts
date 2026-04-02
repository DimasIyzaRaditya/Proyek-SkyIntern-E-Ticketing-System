// Utilitas pengiriman email menggunakan Nodemailer.
// Menyediakan fungsi untuk mengirim email reset password (dengan HTML template)
// dan konfirmasi pemesanan tiket. Jika SMTP belum dikonfigurasi,
// token/informasi akan dicetak ke console sebagai fallback.
import nodemailer from "nodemailer"

// Konfigurasi SMTP transporter untuk pengiriman email (Gmail atau server SMTP lain)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

const getETicketUrl = (bookingCode: string) => {
  return `${process.env.FRONTEND_URL}/bookings/e-ticket/${encodeURIComponent(bookingCode)}`
}

const getETicketQrImageUrl = (bookingCode: string) => {
  const eticketUrl = getETicketUrl(bookingCode)
  return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(eticketUrl)}`
}

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string,
  isMobile: boolean = false
) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - Email not sent")
      return
    }

    // Generate platform-specific reset URL
    let resetUrl: string
    if (isMobile) {
      // For mobile apps - use deep link or mobile-specific URL
      resetUrl = `${process.env.MOBILE_URL || process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    } else {
      // For web - use regular web URL  
      resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
    }

    const platformText = isMobile ? 'aplikasi mobile' : 'website'

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: email,
      subject: "Reset Password Request - SkyIntern",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Reset Your Password</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello,
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        We received a request to reset your password for your SkyIntern account from the ${platformText}. Click the button below to create a new password:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="color: #667eea; font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid #667eea;">
                        ${resetUrl}
                      </p>
                      
                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                        <tr>
                          <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                            <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                              ⚠️ <strong>Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px 0;">
                        © 2026 SkyIntern E-Ticketing System
                      </p>
                      <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })
    console.log(`✅ Reset password email sent to ${email}`)
  } catch (error: any) {
    console.error("❌ Email send error:", error.message)
  }
}

export const sendBookingConfirmation = async (
  email: string,
  bookingCode: string,
  ticketUrl: string
) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - Email not sent")
      return
    }

    const eticketUrl = ticketUrl || getETicketUrl(bookingCode)
    const qrUrl = getETicketQrImageUrl(bookingCode)

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: email,
      subject: `Booking Confirmation - ${bookingCode}`,
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Your booking code: <strong>${bookingCode}</strong></p>
        <p>Lihat e-ticket Anda di link berikut:</p>
        <p><a href="${eticketUrl}">${eticketUrl}</a></p>
        <p>Scan QR berikut untuk membuka e-ticket lebih cepat:</p>
        <p><img src="${qrUrl}" alt="QR E-Ticket ${bookingCode}" width="220" height="220" /></p>
      `
    })
    console.log(`✅ Booking confirmation email sent to ${email}`)
  } catch (error: any) {
    console.error("❌ Email send error:", error.message)
    // Don't throw error for booking confirmation, just log it
  }
}

export const sendTwoFactorCodeEmail = async (
  email: string,
  name: string,
  code: string
) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - 2FA code email not sent")
      return
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: email,
      subject: "Kode Verifikasi Login (2FA) - SkyIntern",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <div style="background: #2563eb; color: #ffffff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">Verifikasi Login SkyIntern</h2>
          </div>
          <div style="padding: 20px;">
            <p>Halo ${name || "Pengguna SkyIntern"},</p>
            <p>Kami menerima permintaan login ke akun Anda. Masukkan kode berikut untuk melanjutkan:</p>
            <div style="margin: 16px 0; padding: 14px; border-radius: 8px; background: #eff6ff; text-align: center;">
              <span style="font-size: 30px; letter-spacing: 6px; font-weight: 700; color: #1d4ed8;">${code}</span>
            </div>
            <p style="margin: 0;">Kode berlaku selama <strong>10 menit</strong>.</p>
            <p style="margin-top: 12px; color: #6b7280; font-size: 13px;">Jika Anda tidak merasa login, abaikan email ini dan segera ganti password akun Anda.</p>
          </div>
        </div>
      `
    })

    console.log(`✅ 2FA code email sent to ${email}`)
  } catch (error: any) {
    console.error("❌ 2FA email send error:", error.message)
  }
}

export const sendDepartureReminderEmail = async (payload: {
  email: string
  name: string
  bookingCode: string
  flightNumber: string
  airlineName: string
  originCity: string
  destinationCity: string
  departureTime: Date
}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - departure reminder email not sent")
      return false
    }

    const departureDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short"
    }).format(payload.departureTime)

    const eticketUrl = getETicketUrl(payload.bookingCode)
    const qrUrl = getETicketQrImageUrl(payload.bookingCode)

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: payload.email,
      subject: `Pengingat Keberangkatan H-1 - ${payload.bookingCode}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <div style="background: #0f766e; color: #ffffff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">Pengingat Keberangkatan H-1</h2>
          </div>
          <div style="padding: 20px;">
            <p>Halo ${payload.name || "Pengguna SkyIntern"},</p>
            <p>Penerbangan Anda akan berangkat dalam kurang lebih 1 hari. Mohon pastikan seluruh dokumen perjalanan sudah siap.</p>

            <div style="margin: 16px 0; padding: 14px; border-radius: 8px; background: #f0fdfa; border: 1px solid #99f6e4;">
              <p style="margin: 0 0 6px 0;"><strong>Kode Booking:</strong> ${payload.bookingCode}</p>
              <p style="margin: 0 0 6px 0;"><strong>Maskapai:</strong> ${payload.airlineName}</p>
              <p style="margin: 0 0 6px 0;"><strong>Nomor Penerbangan:</strong> ${payload.flightNumber}</p>
              <p style="margin: 0 0 6px 0;"><strong>Rute:</strong> ${payload.originCity} → ${payload.destinationCity}</p>
              <p style="margin: 0;"><strong>Waktu Berangkat:</strong> ${departureDate}</p>
            </div>

            <p style="margin: 0 0 6px 0;"><strong>Link E-Ticket:</strong> <a href="${eticketUrl}">${eticketUrl}</a></p>
            <p style="margin: 10px 0 6px 0;">Scan QR untuk membuka e-ticket:</p>
            <p style="margin: 0 0 14px 0;"><img src="${qrUrl}" alt="QR E-Ticket ${payload.bookingCode}" width="180" height="180" /></p>

            <p style="margin: 0;">Datang lebih awal ke bandara untuk proses check-in dan pemeriksaan keamanan.</p>
          </div>
        </div>
      `
    })

    console.log(`✅ Departure reminder email sent to ${payload.email} (${payload.bookingCode})`)
    return true
  } catch (error: any) {
    console.error("❌ Departure reminder email send error:", error.message)
    return false
  }
}

export const sendNewTransactionReminderEmail = async (payload: {
  email: string
  name: string
  bookingCode: string
  flightNumber: string
  airlineName: string
  originCity: string
  destinationCity: string
  departureTime: Date
  daysUntilDeparture: number
}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - new transaction reminder email not sent")
      return false
    }

    const departureDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short"
    }).format(payload.departureTime)

    const dayText = payload.daysUntilDeparture <= 0
      ? "hari ini"
      : `${payload.daysUntilDeparture} hari lagi`

    const eticketUrl = getETicketUrl(payload.bookingCode)
    const qrUrl = getETicketQrImageUrl(payload.bookingCode)

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: payload.email,
      subject: `Transaksi Baru Diterima - ${payload.bookingCode}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <div style="background: #1d4ed8; color: #ffffff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">Transaksi Anda Berhasil Dicatat</h2>
          </div>
          <div style="padding: 20px;">
            <p>Halo ${payload.name || "Pengguna SkyIntern"},</p>
            <p>Transaksi booking Anda sudah masuk ke sistem. Keberangkatan Anda diperkirakan <strong>${dayText}</strong>.</p>

            <div style="margin: 16px 0; padding: 14px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe;">
              <p style="margin: 0 0 6px 0;"><strong>Kode Booking:</strong> ${payload.bookingCode}</p>
              <p style="margin: 0 0 6px 0;"><strong>Maskapai:</strong> ${payload.airlineName}</p>
              <p style="margin: 0 0 6px 0;"><strong>Nomor Penerbangan:</strong> ${payload.flightNumber}</p>
              <p style="margin: 0 0 6px 0;"><strong>Rute:</strong> ${payload.originCity} → ${payload.destinationCity}</p>
              <p style="margin: 0;"><strong>Waktu Berangkat:</strong> ${departureDate}</p>
            </div>

            <p style="margin: 0 0 6px 0;"><strong>Link E-Ticket:</strong> <a href="${eticketUrl}">${eticketUrl}</a></p>
            <p style="margin: 10px 0 6px 0;">Scan QR untuk membuka e-ticket:</p>
            <p style="margin: 0 0 14px 0;"><img src="${qrUrl}" alt="QR E-Ticket ${payload.bookingCode}" width="180" height="180" /></p>

            <p style="margin: 0;">Kami juga akan mengirimkan pengingat tambahan mendekati hari keberangkatan Anda.</p>
          </div>
        </div>
      `
    })

    console.log(`✅ New transaction reminder email sent to ${payload.email} (${payload.bookingCode})`)
    return true
  } catch (error: any) {
    console.error("❌ New transaction reminder email send error:", error.message)
    return false
  }
}

export const sendTodayDepartureReminderEmail = async (payload: {
  email: string
  name: string
  bookingCode: string
  flightNumber: string
  airlineName: string
  originCity: string
  destinationCity: string
  departureTime: Date
  daysUntilDeparture: number
}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - today reminder email not sent")
      return false
    }

    const departureDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short"
    }).format(payload.departureTime)

    const dayText = payload.daysUntilDeparture <= 0
      ? "hari ini"
      : `${payload.daysUntilDeparture} hari lagi`

    const eticketUrl = getETicketUrl(payload.bookingCode)
    const qrUrl = getETicketQrImageUrl(payload.bookingCode)

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: payload.email,
      subject: `Reminder Keberangkatan Hari Ini - ${payload.bookingCode}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <div style="background: #1d4ed8; color: #ffffff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">Reminder Hari Ini</h2>
          </div>
          <div style="padding: 20px;">
            <p>Halo ${payload.name || "Pengguna SkyIntern"},</p>
            <p>Ini adalah pengingat perjalanan Anda hari ini. Keberangkatan Anda diperkirakan <strong>${dayText}</strong>.</p>

            <div style="margin: 16px 0; padding: 14px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe;">
              <p style="margin: 0 0 6px 0;"><strong>Kode Booking:</strong> ${payload.bookingCode}</p>
              <p style="margin: 0 0 6px 0;"><strong>Maskapai:</strong> ${payload.airlineName}</p>
              <p style="margin: 0 0 6px 0;"><strong>Nomor Penerbangan:</strong> ${payload.flightNumber}</p>
              <p style="margin: 0 0 6px 0;"><strong>Rute:</strong> ${payload.originCity} → ${payload.destinationCity}</p>
              <p style="margin: 0;"><strong>Waktu Berangkat:</strong> ${departureDate}</p>
            </div>

            <p style="margin: 0 0 6px 0;"><strong>Link E-Ticket:</strong> <a href="${eticketUrl}">${eticketUrl}</a></p>
            <p style="margin: 10px 0 6px 0;">Scan QR untuk membuka e-ticket:</p>
            <p style="margin: 0 0 14px 0;"><img src="${qrUrl}" alt="QR E-Ticket ${payload.bookingCode}" width="180" height="180" /></p>

            <p style="margin: 0;">Pastikan Anda datang lebih awal ke bandara untuk proses check-in dan pemeriksaan keamanan.</p>
          </div>
        </div>
      `
    })

    console.log(`✅ Today departure reminder email sent to ${payload.email} (${payload.bookingCode})`)
    return true
  } catch (error: any) {
    console.error("❌ Today departure reminder email send error:", error.message)
    return false
  }
}
