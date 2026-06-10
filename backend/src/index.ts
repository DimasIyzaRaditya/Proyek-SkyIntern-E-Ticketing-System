// Entry point aplikasi. Menginisialisasi Express server, mengonfigurasi CORS,
// mendaftarkan semua route API, menyiapkan dokumentasi Swagger, dan menjalankan server.
import "dotenv/config"
import express from "express"
import cors from "cors"
import { createServer } from "http"
import swaggerUi from "swagger-ui-express"
import authRoutes from "./routes/auth.routes"
import adminRoutes from "./routes/admin.routes"
import flightRoutes from "./routes/flight.routes"
import bookingRoutes from "./routes/booking.routes"
import fileRoutes from "./routes/file.routes"
import { getActivePromos } from "./controllers/promo.controller"
import swaggerSpec from "./config/swagger"
import { initializeBucket } from "./utils/minio"
import { startDepartureReminderScheduler } from "./utils/departure-reminder"
import { startBookingExpiryScheduler } from "./utils/booking-expiry"
import { initSocketServer } from "./utils/socket"

const app = express() // Instance utama aplikasi Express

// Initialize Minio bucket
initializeBucket().catch(console.error)
startDepartureReminderScheduler()
startBookingExpiryScheduler()

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)

    // Optional explicit allowlist via env (comma separated)
    const envOrigins = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    if (envOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Development origins: localhost, loopback, and common LAN IP ranges.
    const isDevHttpOrigin = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)
    if (isDevHttpOrigin) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform']
}))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/flights", flightRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/files", fileRoutes)

/**
 * @swagger
 * /api/promos:
 *   get:
 *     summary: Get active public promos
 *     tags: [Promos]
 *     responses:
 *       200:
 *         description: Active promos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promo'
 */
app.get("/api/promos", getActivePromos)

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "list",
    operationsSorter: "method"
  }
}))

app.get("/", (req, res) => {
  res.send("SkyIntern E-Ticketing API Running")
})

const PORT = process.env.PORT || 3000
const httpServer = createServer(app)
initSocketServer(httpServer)

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`WebSocket ready on ws://localhost:${PORT}`)
})
