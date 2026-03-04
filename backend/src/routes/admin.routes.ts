import { Router } from "express"
import multer from "multer"
import { authenticate, isAdmin } from "../middleware/auth.middleware"
import * as airportController from "../controllers/airport.controller"
import * as airlineController from "../controllers/airline.controller"
import * as flightController from "../controllers/flight.controller"
import * as seatController from "../controllers/seat.controller"
import * as bookingController from "../controllers/booking.controller"

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

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
router.get("/airlines", airlineController.getAllAirlines)
router.get("/airlines/:id", airlineController.getAirline)
router.put("/airlines/:id", upload.single("logo"), airlineController.updateAirline)
router.delete("/airlines/:id", airlineController.deleteAirline)

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
 *                 type: string
 *               originId:
 *                 type: string
 *               destinationId:
 *                 type: string
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
 *                 type: string
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
 *                 type: string
 *     responses:
 *       201:
 *         description: Seats generated
 */
router.post("/seats/generate", seatController.generateStandardSeats)

// Booking & Transaction Management
router.get("/bookings", bookingController.getAllBookingsAdmin)

export default router
