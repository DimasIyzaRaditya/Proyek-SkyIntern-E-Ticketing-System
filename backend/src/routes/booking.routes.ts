// Route pemesanan tiket. Webhook notifikasi Midtrans tidak memerlukan autentikasi,
// sedangkan semua route lain (buat booking, bayar, lihat, batalkan, tiket)
// memerlukan user yang sudah login.
import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middleware/auth.middleware"
import * as bookingController from "../controllers/booking.controller"

const upload = multer({ storage: multer.memoryStorage() }) // Simpan file di memori sebelum upload ke MinIO

const router = Router() // Router Express untuk semua route pemesanan

// Payment notification webhook (no auth required - called by Midtrans)
/**
 * @swagger
 * /api/bookings/payment/notification:
 *   post:
 *     summary: Midtrans payment notification webhook (untuk testing manual)
 *     tags: [Bookings]
 *     description: |
 *       Endpoint ini dipanggil oleh Midtrans saat status pembayaran berubah.
 *       Untuk testing manual, `signature_key` harus di-generate dengan rumus:
 *
 *       `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`
 *
 *       Cara generate di Node.js (jalankan di terminal):
 *       ```
 *       node -e "const c=require('crypto'); console.log(c.createHash('sha512').update('ORDER_ID'+'200'+'750000.00'+'SERVER_KEY').digest('hex'))"
 *       ```
 *
 *       Nilai `order_id` harus sama dengan kolom `transactionId` di tabel Payment.
 *       Cek via: `GET /api/bookings/{id}` → lihat field `payment.transactionId`.
 *
 *       **Status yang bisa diuji:**
 *       - `settlement` → pembayaran SUKSES, booking jadi PAID, tiket dibuat
 *       - `pending`    → pembayaran PENDING
 *       - `expire`     → pembayaran GAGAL, booking CANCELLED, kursi dilepas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - transaction_status
 *               - gross_amount
 *               - status_code
 *               - signature_key
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: Harus sama dengan transactionId di tabel Payment
 *                 example: "SKY123-1742123456789"
 *               transaction_status:
 *                 type: string
 *                 enum: [settlement, capture, pending, deny, expire, cancel]
 *                 example: "settlement"
 *               fraud_status:
 *                 type: string
 *                 enum: [accept, challenge, deny]
 *                 example: "accept"
 *               gross_amount:
 *                 type: string
 *                 description: Harus format string dengan desimal .00
 *                 example: "750000.00"
 *               status_code:
 *                 type: string
 *                 example: "200"
 *               signature_key:
 *                 type: string
 *                 description: SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
 *                 example: "isi_hasil_sha512_disini"
 *     responses:
 *       200:
 *         description: Notifikasi berhasil diproses
 *       403:
 *         description: Signature tidak valid
 *       404:
 *         description: Pembayaran tidak ditemukan
 */
router.post("/payment/notification", bookingController.paymentNotification)

// All other booking routes require authentication
router.use(authenticate)

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flightId
 *               - passengers
 *             properties:
 *               flightId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [ADULT, CHILD]
 *                     title:
 *                       type: string
 *                       example: Mr
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     documentType:
 *                       type: string
 *                       enum: [KTP, PASSPORT]
 *                       description: KTP untuk WNI, PASSPORT untuk WNA atau perjalanan internasional
 *                       example: KTP
 *                     documentNumber:
 *                       type: string
 *                       description: Nomor NIK 16 digit (KTP) atau nomor paspor
 *                       example: '1234567890123456'
 *                     nationality:
 *                       type: string
 *                       example: Indonesian
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", bookingController.createBooking)

/**
 * @swagger
 * /api/bookings/passengers/{passengerId}/document-image:
 *   post:
 *     summary: Upload gambar dokumen identitas penumpang (KTP/Paspor)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: passengerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID penumpang (dari response createBooking → booking.passengers[].id)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: File gambar KTP atau paspor (jpg, png, pdf)
 *     responses:
 *       200:
 *         description: Gambar berhasil diunggah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentImageUrl:
 *                   type: string
 *       400:
 *         description: File tidak disertakan
 *       403:
 *         description: Bukan penumpang milik user ini
 *       404:
 *         description: Penumpang tidak ditemukan
 */
router.post("/passengers/:passengerId/document-image", upload.single("document"), bookingController.uploadPassengerDocument)

/**
 * @swagger
 * /api/bookings/{id}/payment:
 *   post:
 *     summary: Create payment transaction (Generate Midtrans Snap Token)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Payment transaction created with Snap Token
 */
router.post("/:id/payment", bookingController.processPayment)

router.post("/:id/sync-payment", bookingController.syncPaymentStatus)
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, ISSUED, CANCELLED]
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get("/", bookingController.getMyBookings)

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking detail
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking detail retrieved
 */
router.get("/:id", bookingController.getBookingDetail)

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.post("/:id/cancel", bookingController.cancelBooking)

/**
 * @swagger
 * /api/bookings/tickets/{id}:
 *   get:
 *     summary: Get ticket detail
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket detail retrieved
 */
router.get("/tickets/:id", bookingController.getTicket)

export default router
