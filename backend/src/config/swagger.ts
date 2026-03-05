// Konfigurasi Swagger/OpenAPI untuk menghasilkan dokumentasi API secara otomatis
// dari anotasi JSDoc yang ada di file route. Dokumentasi tersedia di /api-docs.
import swaggerJsdoc from "swagger-jsdoc"

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
        url: "http://localhost:3000",
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
  apis: ["./src/routes/*.ts"]
}

export default swaggerJsdoc(options)