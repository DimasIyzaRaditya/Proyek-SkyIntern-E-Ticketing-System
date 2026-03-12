// Route admin. Semua endpoint di sini dilindungi middleware authenticate + isAdmin.
// Mencakup manajemen bandara, maskapai (dengan upload logo), penerbangan,
// kursi, pemesanan, dan data user. Menggunakan multer untuk upload file.
import { Router } from "express"
import multer from "multer"
import { authenticate, isAdmin } from "../middleware/auth.middleware"
import * as airportController from "../controllers/airport.controller"
import * as airlineController from "../controllers/airline.controller"
import * as flightController from "../controllers/flight.controller"
import * as seatController from "../controllers/seat.controller"
import * as bookingController from "../controllers/booking.controller"
import { getAllUsers, deleteUser, blockUser } from "../controllers/auth.controller"
import * as promoController from "../controllers/promo.controller"

const router = Router() // Router Express untuk semua route admin
const upload = multer({ storage: multer.memoryStorage() }) // Middleware upload file, disimpan di memory (buffer) bukan disk

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin)

// Airport Management
/**
 * @swagger
 * /api/admin/airports:
 *   post:
 *     summary: Create new airport
 *     tags: [Admin - Airports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - city
 *               - country
 *             properties:
 *               code:
 *                 type: string
 *                 example: CGK
 *               name:
 *                 type: string
 *                 example: Soekarno-Hatta International Airport
 *               city:
 *                 type: string
 *                 example: Jakarta
 *               country:
 *                 type: string
 *                 example: Indonesia
 *               timezone:
 *                 type: string
 *                 example: Asia/Jakarta
 *     responses:
 *       201:
 *         description: Airport created
 */
router.post("/airports", airportController.createAirport)
router.get("/airports", airportController.getAllAirports)
router.get("/airports/:id", airportController.getAirport)
router.put("/airports/:id", airportController.updateAirport)
router.delete("/airports/:id", airportController.deleteAirport)
router.post("/airports/:id/city-image", upload.single("image"), airportController.uploadAirportCityImage)

// Airline Management
/**
 * @swagger
 * /api/admin/airlines:
 *   post:
 *     summary: Create new airline
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - country
 *             properties:
 *               code:
 *                 type: string
 *                 example: GA
 *               name:
 *                 type: string
 *                 example: Garuda Indonesia
 *               country:
 *                 type: string
 *                 example: Indonesia
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Airline created
 */
router.post("/airlines", upload.single("logo"), airlineController.createAirline)
/**
 * @swagger
 * /api/admin/airlines:
 *   get:
 *     summary: Get all airlines
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of airlines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 airlines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       country:
 *                         type: string
 *                       logo:
 *                         type: string
 *                         nullable: true
 *                         description: URL logo di MinIO
 */
router.get("/airlines", airlineController.getAllAirlines)
/**
 * @swagger
 * /api/admin/airlines/{id}:
 *   get:
 *     summary: Get airline by ID
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID maskapai
 *     responses:
 *       200:
 *         description: Data maskapai
 *       404:
 *         description: Airline not found
 */
router.get("/airlines/:id", airlineController.getAirline)
/**
 * @swagger
 * /api/admin/airlines/{id}:
 *   put:
 *     summary: Update airline
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - country
 *             properties:
 *               code:
 *                 type: string
 *                 example: GA
 *               name:
 *                 type: string
 *                 example: Garuda Indonesia
 *               country:
 *                 type: string
 *                 example: Indonesia
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Upload file gambar logo (opsional, kosongkan jika tidak diubah)
 *     responses:
 *       200:
 *         description: Airline updated
 */
router.put("/airlines/:id", upload.single("logo"), airlineController.updateAirline)
/**
 * @swagger
 * /api/admin/airlines/{id}:
 *   delete:
 *     summary: Delete airline
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID maskapai yang akan dihapus
 *     responses:
 *       200:
 *         description: Airline deleted successfully
 *       404:
 *         description: Airline not found
 */
router.delete("/airlines/:id", airlineController.deleteAirline)
/**
 * @swagger
 * /api/admin/airlines/{id}/logo:
 *   delete:
 *     summary: Remove airline logo
 *     description: Menghapus logo maskapai dari MinIO dan set logo menjadi null di database. Gunakan ini jika file logo sudah terhapus dari MinIO agar URL tidak broken.
 *     tags: [Admin - Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID maskapai
 *     responses:
 *       200:
 *         description: Logo removed successfully
 *       400:
 *         description: Airline does not have a logo
 *       404:
 *         description: Airline not found
 */
router.delete("/airlines/:id/logo", airlineController.removeAirlineLogo)

// Flight Management
/**
 * @swagger
 * /api/admin/flights:
 *   post:
 *     summary: Create new flight
 *     tags: [Admin - Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flightNumber
 *               - airlineId
 *               - originId
 *               - destinationId
 *               - departureTime
 *               - arrivalTime
 *               - basePrice
 *             properties:
 *               flightNumber:
 *                 type: string
 *                 example: GA123
 *               airlineId:
 *                 type: integer
 *                 example: 1
 *               originId:
 *                 type: integer
 *                 example: 1
 *               destinationId:
 *                 type: integer
 *                 example: 2
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *               basePrice:
 *                 type: integer
 *                 example: 1500000
 *               tax:
 *                 type: integer
 *                 example: 150000
 *               adminFee:
 *                 type: integer
 *                 example: 10000
 *               aircraft:
 *                 type: string
 *                 example: Boeing 737-800
 *               facilities:
 *                 type: string
 *               rules:
 *                 type: string
 *     responses:
 *       201:
 *         description: Flight created
 */
router.post("/flights", flightController.createFlight)
router.get("/flights", flightController.getAllFlightsAdmin)
router.put("/flights/:id", flightController.updateFlight)
router.delete("/flights/:id", flightController.deleteFlight)

// Seat Management
/**
 * @swagger
 * /api/admin/seats:
 *   post:
 *     summary: Create seats for flight
 *     tags: [Admin - Seats]
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
 *               - seats
 *             properties:
 *               flightId:
 *                 type: integer
 *                 example: 1
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: 1A
 *                     seatClass:
 *                       type: string
 *                       enum: [ECONOMY, BUSINESS, FIRST]
 *                     isExitRow:
 *                       type: boolean
 *                     additionalPrice:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Seats created
 */
router.post("/seats", seatController.createFlightSeats)
router.put("/seats/:id", seatController.updateFlightSeat)

/**
 * @swagger
 * /api/admin/seats/generate:
 *   post:
 *     summary: Generate standard seats for flight
 *     tags: [Admin - Seats]
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
 *             properties:
 *               flightId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Seats generated
 */
router.post("/seats/generate", seatController.generateStandardSeats)

// Booking & Transaction Management
router.get("/bookings", bookingController.getAllBookingsAdmin)
router.put("/bookings/:id/status", bookingController.updateAdminBookingStatus)

// User Management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         enum: [ADMIN, USER]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/users", getAllUsers)
router.put("/users/:id/block", blockUser)

/**
 * @swagger
 * /api/admin/users/{email}:
 *   delete:
 *     summary: Delete user account by email
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email user yang akan dihapus
 *         example: user@example.com
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Cannot delete admin account
 *       404:
 *         description: User not found
 */
router.delete("/users/:email", deleteUser)

// Promo Management
router.get("/promos", promoController.getAllPromos)
router.post("/promos", promoController.createPromo)
router.put("/promos/:id", promoController.updatePromo)
router.delete("/promos/:id", promoController.deletePromo)

export default router
