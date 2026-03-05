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

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string
) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  SMTP not configured - Email not sent")
      console.log(`🔑 Reset token for ${email}: ${resetToken}`)
      console.log(`⏰ Token expires in 60 minutes`)
      return
    }

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}` // URL tautan reset password yang dikirimkan ke email user

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
                        We received a request to reset your password for your SkyIntern account. Click the button below to create a new password:
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
    console.log(`🔑 Reset token for ${email}: ${resetToken}`)
    console.log(`⏰ Token expires in 60 minutes`)
    // Don't throw error in development, just log the token
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
      console.log(`Booking confirmation for ${email}: ${bookingCode}`)
      return
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@skyintern.com",
      to: email,
      subject: `Booking Confirmation - ${bookingCode}`,
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Your booking code: <strong>${bookingCode}</strong></p>
        <p>Download your ticket: <a href="${ticketUrl}">Download</a></p>
      `
    })
    console.log(`✅ Booking confirmation email sent to ${email}`)
  } catch (error: any) {
    console.error("❌ Email send error:", error.message)
    // Don't throw error for booking confirmation, just log it
  }
}
