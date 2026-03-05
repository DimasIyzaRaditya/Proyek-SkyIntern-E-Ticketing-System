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
 *     tags: [Flights]
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
 *     responses:
 *       200:
 *         description: Flights retrieved successfully
 */
router.get("/search", flightController.searchFlights)

router.get("/airports", airportController.getPublicAirportOptions)

/**
 * @swagger
 * /api/flights/{id}:
 *   get:
 *     summary: Get flight detail
 *     tags: [Flights]
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
 *     tags: [Flights]
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

export default router
