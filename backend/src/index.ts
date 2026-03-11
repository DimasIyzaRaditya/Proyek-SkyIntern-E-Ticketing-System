// Entry point aplikasi. Menginisialisasi Express server, mengonfigurasi CORS,
// mendaftarkan semua route API, menyiapkan dokumentasi Swagger, dan menjalankan server.
import "dotenv/config"
import express from "express"
import cors from "cors"
import swaggerUi from "swagger-ui-express"
import authRoutes from "./routes/auth.routes"
import adminRoutes from "./routes/admin.routes"
import flightRoutes from "./routes/flight.routes"
import bookingRoutes from "./routes/booking.routes"
import swaggerSpec from "./config/swagger"
import { initializeBucket } from "./utils/minio"

const app = express() // Instance utama aplikasi Express

// Initialize Minio bucket
initializeBucket().catch(console.error)

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow specific production origins
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
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

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get("/", (req, res) => {
  res.send("SkyIntern E-Ticketing API Running")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`)
})