import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import * as bookingController from "../controllers/booking.controller"

const router = Router()

// Payment notification webhook (no auth required - called by Midtrans)
/**
 * @swagger
 * /api/bookings/payment/notification:
 *   post:
 *     summary: Midtrans payment notification webhook
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification processed
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
 *                     idType:
 *                       type: string
 *                       example: KTP
 *                     idNumber:
 *                       type: string
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
