// Konfigurasi Swagger/OpenAPI untuk menghasilkan dokumentasi API secara otomatis
// dari anotasi JSDoc yang ada di file route. Dokumentasi tersedia di /api-docs.
import swaggerJsdoc from "swagger-jsdoc"

const port = Number(process.env.PORT ?? 3000)
const swaggerServerUrl = process.env.SWAGGER_SERVER_URL ?? `http://localhost:${port}`

// Opsi konfigurasi Swagger: metadata API, server URL, dan pola file route yang dibaca
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkyIntern E-Ticketing API",
      version: "1.0.0",
      description: "API documentation for SkyIntern E-Ticketing System"
    },
    servers: [
      {
        url: swaggerServerUrl,
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"]
}

export default swaggerJsdoc(options)