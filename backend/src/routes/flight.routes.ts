// Route penerbangan publik. Menyediakan endpoint pencarian penerbangan,
// opsi daftar bandara, detail penerbangan, dan seat map (memerlukan autentikasi).
import { Router } from "express"
import * as flightController from "../controllers/flight.controller"
import * as seatController from "../controllers/seat.controller"
import * as airportController from "../controllers/airport.controller"
import { authenticate } from "../middleware/auth.middleware"

const router = Router() // Router Express untuk semua route penerbangan publik

/**
 * @swagger
 * /api/flights/search:
 *   get:
 *     summary: Search flights
 *     tags: [Public - Flights]
 *     parameters:
 *       - in: query
 *         name: originId
 *         schema:
 *           type: string
 *         description: Origin airport ID
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *         description: Destination airport ID
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: passengerCount
 *         schema:
 *           type: integer
 *         description: Number of passengers
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price-asc, price-desc, duration-asc, duration-desc, time-asc]
 *         description: Sort by field
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *       - in: query
 *         name: originCity
 *         schema:
 *           type: string
 *         description: Origin city name (case-insensitive exact match)
 *       - in: query
 *         name: destinationCity
 *         schema:
 *           type: string
 *         description: Destination city name (case-insensitive exact match)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for paginated results
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Flights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       flightNumber:
 *                         type: string
 *                       departureTime:
 *                         type: string
 *                         format: date-time
 *                       arrivalTime:
 *                         type: string
 *                         format: date-time
 *                       basePrice:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get("/search", flightController.searchFlights)

/**
 * @swagger
 * /api/flights/airports:
 *   get:
 *     summary: Get public airport options
 *     tags: [Public - Flights]
 *     responses:
 *       200:
 *         description: Airport options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 airports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Soekarno-Hatta International Airport
 *                       city:
 *                         type: string
 *                         example: Jakarta
 *                       country:
 *                         type: string
 *                         example: Indonesia
 *                       timezone:
 *                         type: string
 *                         nullable: true
 *                         example: Asia/Jakarta
 *                       cityImageUrl:
 *                         type: string
 *                         nullable: true
 */
router.get("/airports", airportController.getPublicAirportOptions)

/**
 * @swagger
 * /api/flights/{id}:
 *   get:
 *     summary: Get flight detail
 *     tags: [Public - Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flight detail retrieved
 *       404:
 *         description: Flight not found
 */
router.get("/:id", flightController.getFlightDetail)

/**
 * @swagger
 * /api/flights/{flightId}/seats:
 *   get:
 *     summary: Get seat map for flight
 *     tags: [Flight Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seat map retrieved
 */
router.get("/:flightId/seats", authenticate, seatController.getSeatMap)

/**
 * @swagger
 * /api/flights/{flightId}/seats/hold:
 *   post:
 *     summary: Hold selected seats temporarily
 *     tags: [Flight Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
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
 *               - seatIds
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       200:
 *         description: Seats held successfully
 */
router.post("/:flightId/seats/hold", authenticate, seatController.holdSeats)

/**
 * @swagger
 * /api/flights/{flightId}/seats/release:
 *   post:
 *     summary: Release previously held seats
 *     tags: [Flight Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
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
 *               - seatIds
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       200:
 *         description: Seats released successfully
 */
router.post("/:flightId/seats/release", authenticate, seatController.releaseSeats)

export default router
