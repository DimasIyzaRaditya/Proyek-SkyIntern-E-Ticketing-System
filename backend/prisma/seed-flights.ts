/**
 * Seed domestic and international flights into the database.
 * Run: npx tsx prisma/seed-flights.ts
 *
 * Requires airports (seed-airports.ts) and airlines (seed.ts) to be seeded first.
 */
import "dotenv/config"
import prisma from "../src/prisma/client"

// ── Helper: add hours to a base date ─────────────────────────────────────────
function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 3600000)
}
function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86400000)
}

// ── Flight route definitions ──────────────────────────────────────────────────
type RouteTemplate = {
  fromCity: string
  toCity: string
  airlineCode: string
  flightPrefix: string
  durationMin: number   // flight duration in minutes
  basePrice: number     // IDR
  tax: number
  adminFee: number
  departureHours: number[] // departure times (hours) for each repetition per day
}

const DOMESTIC_ROUTES: RouteTemplate[] = [
  // Jakarta as hub
  { fromCity: "Jakarta",    toCity: "Denpasar",      airlineCode: "GA", flightPrefix: "GA-100", durationMin: 90,  basePrice: 900000,  tax: 90000,  adminFee: 10000, departureHours: [6, 10, 14, 18] },
  { fromCity: "Jakarta",    toCity: "Denpasar",      airlineCode: "QG", flightPrefix: "QG-100", durationMin: 90,  basePrice: 700000,  tax: 70000,  adminFee: 10000, departureHours: [7, 11, 16] },
  { fromCity: "Jakarta",    toCity: "Denpasar",      airlineCode: "JT", flightPrefix: "JT-100", durationMin: 90,  basePrice: 650000,  tax: 65000,  adminFee: 10000, departureHours: [9, 15, 20] },
  { fromCity: "Denpasar",   toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-200", durationMin: 90,  basePrice: 900000,  tax: 90000,  adminFee: 10000, departureHours: [8, 12, 17, 21] },
  { fromCity: "Denpasar",   toCity: "Jakarta",       airlineCode: "QG", flightPrefix: "QG-200", durationMin: 90,  basePrice: 700000,  tax: 70000,  adminFee: 10000, departureHours: [9, 13, 19] },

  { fromCity: "Jakarta",    toCity: "Surabaya",      airlineCode: "GA", flightPrefix: "GA-300", durationMin: 60,  basePrice: 500000,  tax: 50000,  adminFee: 10000, departureHours: [6, 9, 12, 15, 18] },
  { fromCity: "Jakarta",    toCity: "Surabaya",      airlineCode: "JT", flightPrefix: "JT-300", durationMin: 60,  basePrice: 400000,  tax: 40000,  adminFee: 10000, departureHours: [7, 11, 16, 20] },
  { fromCity: "Surabaya",   toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-400", durationMin: 60,  basePrice: 500000,  tax: 50000,  adminFee: 10000, departureHours: [8, 11, 14, 17, 20] },

  { fromCity: "Jakarta",    toCity: "Medan",         airlineCode: "GA", flightPrefix: "GA-500", durationMin: 120, basePrice: 950000,  tax: 95000,  adminFee: 10000, departureHours: [7, 11, 16] },
  { fromCity: "Jakarta",    toCity: "Medan",         airlineCode: "JT", flightPrefix: "JT-500", durationMin: 120, basePrice: 780000,  tax: 78000,  adminFee: 10000, departureHours: [8, 13, 18] },
  { fromCity: "Medan",      toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-600", durationMin: 120, basePrice: 950000,  tax: 95000,  adminFee: 10000, departureHours: [9, 14, 19] },

  { fromCity: "Jakarta",    toCity: "Makassar",      airlineCode: "GA", flightPrefix: "GA-700", durationMin: 150, basePrice: 1100000, tax: 110000, adminFee: 10000, departureHours: [6, 12, 18] },
  { fromCity: "Jakarta",    toCity: "Makassar",      airlineCode: "ID", flightPrefix: "ID-700", durationMin: 150, basePrice: 950000,  tax: 95000,  adminFee: 10000, departureHours: [8, 15] },
  { fromCity: "Makassar",   toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-800", durationMin: 150, basePrice: 1100000, tax: 110000, adminFee: 10000, departureHours: [7, 13, 19] },

  { fromCity: "Jakarta",    toCity: "Yogyakarta",    airlineCode: "GA", flightPrefix: "GA-900", durationMin: 65,  basePrice: 450000,  tax: 45000,  adminFee: 10000, departureHours: [6, 9, 12, 15, 18] },
  { fromCity: "Jakarta",    toCity: "Yogyakarta",    airlineCode: "QG", flightPrefix: "QG-900", durationMin: 65,  basePrice: 380000,  tax: 38000,  adminFee: 10000, departureHours: [7, 11, 14, 17] },
  { fromCity: "Yogyakarta", toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-950", durationMin: 65,  basePrice: 450000,  tax: 45000,  adminFee: 10000, departureHours: [8, 11, 14, 17, 20] },

  { fromCity: "Jakarta",    toCity: "Semarang",      airlineCode: "GA", flightPrefix: "GA-102", durationMin: 55,  basePrice: 420000,  tax: 42000,  adminFee: 10000, departureHours: [6, 9, 13, 17] },
  { fromCity: "Jakarta",    toCity: "Semarang",      airlineCode: "JT", flightPrefix: "JT-102", durationMin: 55,  basePrice: 350000,  tax: 35000,  adminFee: 10000, departureHours: [8, 12, 16, 20] },
  { fromCity: "Semarang",   toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-103", durationMin: 55,  basePrice: 420000,  tax: 42000,  adminFee: 10000, departureHours: [7, 11, 15, 19] },

  { fromCity: "Jakarta",    toCity: "Balikpapan",    airlineCode: "GA", flightPrefix: "GA-104", durationMin: 135, basePrice: 1050000, tax: 105000, adminFee: 10000, departureHours: [7, 12, 17] },
  { fromCity: "Jakarta",    toCity: "Balikpapan",    airlineCode: "JT", flightPrefix: "JT-104", durationMin: 135, basePrice: 900000,  tax: 90000,  adminFee: 10000, departureHours: [9, 15] },
  { fromCity: "Balikpapan", toCity: "Jakarta",       airlineCode: "GA", flightPrefix: "GA-105", durationMin: 135, basePrice: 1050000, tax: 105000, adminFee: 10000, departureHours: [8, 13, 18] },

  { fromCity: "Jakarta",    toCity: "Manado",        airlineCode: "GA", flightPrefix: "GA-106", durationMin: 165, basePrice: 1250000, tax: 125000, adminFee: 10000, departureHours: [7, 14] },
  { fromCity: "Jakarta",    toCity: "Lombok",        airlineCode: "QG", flightPrefix: "QG-106", durationMin: 100, basePrice: 820000,  tax: 82000,  adminFee: 10000, departureHours: [8, 13] },
  { fromCity: "Jakarta",    toCity: "Batam",         airlineCode: "JT", flightPrefix: "JT-106", durationMin: 95,  basePrice: 700000,  tax: 70000,  adminFee: 10000, departureHours: [7, 11, 16] },
  { fromCity: "Jakarta",    toCity: "Palembang",     airlineCode: "GA", flightPrefix: "GA-108", durationMin: 75,  basePrice: 520000,  tax: 52000,  adminFee: 10000, departureHours: [9, 14] },
  { fromCity: "Jakarta",    toCity: "Pekanbaru",     airlineCode: "QG", flightPrefix: "QG-108", durationMin: 90,  basePrice: 600000,  tax: 60000,  adminFee: 10000, departureHours: [10, 15] },
  { fromCity: "Jakarta",    toCity: "Pontianak",     airlineCode: "GA", flightPrefix: "GA-110", durationMin: 90,  basePrice: 620000,  tax: 62000,  adminFee: 10000, departureHours: [8, 14] },
  { fromCity: "Jakarta",    toCity: "Bandar Lampung", airlineCode: "QG", flightPrefix: "QG-110", durationMin: 40, basePrice: 300000,  tax: 30000,  adminFee: 10000, departureHours: [7, 11, 15] },

  // Surabaya routes
  { fromCity: "Surabaya",   toCity: "Denpasar",      airlineCode: "GA", flightPrefix: "GA-400D", durationMin: 35, basePrice: 350000,  tax: 35000,  adminFee: 10000, departureHours: [7, 11, 15, 19] },
  { fromCity: "Surabaya",   toCity: "Makassar",      airlineCode: "GA", flightPrefix: "GA-401",  durationMin: 80, basePrice: 650000,  tax: 65000,  adminFee: 10000, departureHours: [8, 14] },
  { fromCity: "Surabaya",   toCity: "Medan",         airlineCode: "GA", flightPrefix: "GA-402",  durationMin: 105, basePrice: 850000, tax: 85000,  adminFee: 10000, departureHours: [9, 16] },
  { fromCity: "Denpasar",   toCity: "Surabaya",      airlineCode: "GA", flightPrefix: "GA-403",  durationMin: 35, basePrice: 350000,  tax: 35000,  adminFee: 10000, departureHours: [8, 12, 16, 20] },

  // Yogyakarta routes
  { fromCity: "Yogyakarta", toCity: "Denpasar",      airlineCode: "GA", flightPrefix: "GA-404",  durationMin: 60, basePrice: 550000,  tax: 55000,  adminFee: 10000, departureHours: [8, 13] },
  { fromCity: "Yogyakarta", toCity: "Semarang",      airlineCode: "QG", flightPrefix: "QG-404",  durationMin: 25, basePrice: 197000,  tax: 0,      adminFee: 0,     departureHours: [7, 9, 11, 13, 15] },
  { fromCity: "Semarang",   toCity: "Yogyakarta",    airlineCode: "QG", flightPrefix: "QG-405",  durationMin: 25, basePrice: 197000,  tax: 0,      adminFee: 0,     departureHours: [8, 10, 12, 14, 16] },
  { fromCity: "Yogyakarta", toCity: "Medan",         airlineCode: "GA", flightPrefix: "GA-405",  durationMin: 120, basePrice: 900000, tax: 90000,  adminFee: 10000, departureHours: [9] },

  // Medan routes
  { fromCity: "Medan",      toCity: "Denpasar",      airlineCode: "GA", flightPrefix: "GA-406",  durationMin: 165, basePrice: 1200000, tax: 120000, adminFee: 10000, departureHours: [8, 14] },
  { fromCity: "Medan",      toCity: "Makassar",      airlineCode: "GA", flightPrefix: "GA-407",  durationMin: 195, basePrice: 1400000, tax: 140000, adminFee: 10000, departureHours: [10] },
]

const INTL_ROUTES: RouteTemplate[] = [
  // Jakarta international
  { fromCity: "Jakarta",       toCity: "Singapore",     airlineCode: "SQ", flightPrefix: "SQ-900", durationMin: 95,  basePrice: 1500000, tax: 150000, adminFee: 25000, departureHours: [7, 11, 15, 19] },
  { fromCity: "Jakarta",       toCity: "Singapore",     airlineCode: "GA", flightPrefix: "GA-M01", durationMin: 95,  basePrice: 1700000, tax: 170000, adminFee: 25000, departureHours: [8, 13, 18] },
  { fromCity: "Singapore",     toCity: "Jakarta",       airlineCode: "SQ", flightPrefix: "SQ-901", durationMin: 95,  basePrice: 1500000, tax: 150000, adminFee: 25000, departureHours: [9, 13, 17, 21] },

  { fromCity: "Jakarta",       toCity: "Kuala Lumpur",  airlineCode: "MH", flightPrefix: "MH-700", durationMin: 105, basePrice: 1300000, tax: 130000, adminFee: 25000, departureHours: [8, 14, 19] },
  { fromCity: "Jakarta",       toCity: "Kuala Lumpur",  airlineCode: "AK", flightPrefix: "AK-700", durationMin: 105, basePrice: 900000,  tax: 90000,  adminFee: 25000, departureHours: [7, 12, 17] },
  { fromCity: "Kuala Lumpur",  toCity: "Jakarta",       airlineCode: "MH", flightPrefix: "MH-701", durationMin: 105, basePrice: 1300000, tax: 130000, adminFee: 25000, departureHours: [10, 15, 20] },

  { fromCity: "Jakarta",       toCity: "Bangkok",       airlineCode: "TG", flightPrefix: "TG-400", durationMin: 165, basePrice: 2200000, tax: 220000, adminFee: 25000, departureHours: [9, 16] },
  { fromCity: "Jakarta",       toCity: "Bangkok",       airlineCode: "GA", flightPrefix: "GA-M02", durationMin: 165, basePrice: 2500000, tax: 250000, adminFee: 25000, departureHours: [11] },
  { fromCity: "Bangkok",       toCity: "Jakarta",       airlineCode: "TG", flightPrefix: "TG-401", durationMin: 165, basePrice: 2200000, tax: 220000, adminFee: 25000, departureHours: [12, 19] },

  { fromCity: "Jakarta",       toCity: "Tokyo",         airlineCode: "JL", flightPrefix: "JL-700", durationMin: 420, basePrice: 5500000, tax: 550000, adminFee: 50000, departureHours: [8, 20] },
  { fromCity: "Jakarta",       toCity: "Tokyo",         airlineCode: "GA", flightPrefix: "GA-M04", durationMin: 420, basePrice: 6000000, tax: 600000, adminFee: 50000, departureHours: [22] },
  { fromCity: "Tokyo",         toCity: "Jakarta",       airlineCode: "JL", flightPrefix: "JL-701", durationMin: 390, basePrice: 5500000, tax: 550000, adminFee: 50000, departureHours: [10, 22] },

  { fromCity: "Jakarta",       toCity: "Seoul",         airlineCode: "KE", flightPrefix: "KE-600", durationMin: 390, basePrice: 4800000, tax: 480000, adminFee: 50000, departureHours: [9, 22] },
  { fromCity: "Seoul",         toCity: "Jakarta",       airlineCode: "KE", flightPrefix: "KE-601", durationMin: 390, basePrice: 4800000, tax: 480000, adminFee: 50000, departureHours: [11, 23] },

  { fromCity: "Jakarta",       toCity: "Hong Kong",     airlineCode: "CX", flightPrefix: "CX-700", durationMin: 225, basePrice: 3200000, tax: 320000, adminFee: 35000, departureHours: [8, 17] },
  { fromCity: "Hong Kong",     toCity: "Jakarta",       airlineCode: "CX", flightPrefix: "CX-701", durationMin: 225, basePrice: 3200000, tax: 320000, adminFee: 35000, departureHours: [10, 19] },

  { fromCity: "Jakarta",       toCity: "Dubai",         airlineCode: "EK", flightPrefix: "EK-350", durationMin: 480, basePrice: 7500000, tax: 750000, adminFee: 75000, departureHours: [23] },
  { fromCity: "Dubai",         toCity: "Jakarta",       airlineCode: "EK", flightPrefix: "EK-351", durationMin: 450, basePrice: 7500000, tax: 750000, adminFee: 75000, departureHours: [3] },

  // Bali international
  { fromCity: "Denpasar",      toCity: "Singapore",     airlineCode: "SQ", flightPrefix: "SQ-910", durationMin: 120, basePrice: 1700000, tax: 170000, adminFee: 25000, departureHours: [9, 14, 18] },
  { fromCity: "Denpasar",      toCity: "Singapore",     airlineCode: "GA", flightPrefix: "GA-M05", durationMin: 120, basePrice: 1900000, tax: 190000, adminFee: 25000, departureHours: [11, 16] },
  { fromCity: "Singapore",     toCity: "Denpasar",      airlineCode: "SQ", flightPrefix: "SQ-911", durationMin: 120, basePrice: 1700000, tax: 170000, adminFee: 25000, departureHours: [10, 15, 19] },

  { fromCity: "Denpasar",      toCity: "Kuala Lumpur",  airlineCode: "AK", flightPrefix: "AK-710", durationMin: 150, basePrice: 1100000, tax: 110000, adminFee: 25000, departureHours: [8, 13] },
  { fromCity: "Denpasar",      toCity: "Bangkok",       airlineCode: "TG", flightPrefix: "TG-410", durationMin: 180, basePrice: 2400000, tax: 240000, adminFee: 25000, departureHours: [10] },
  { fromCity: "Denpasar",      toCity: "Tokyo",         airlineCode: "JL", flightPrefix: "JL-710", durationMin: 440, basePrice: 5800000, tax: 580000, adminFee: 50000, departureHours: [9] },
  { fromCity: "Denpasar",      toCity: "Seoul",         airlineCode: "KE", flightPrefix: "KE-610", durationMin: 400, basePrice: 5000000, tax: 500000, adminFee: 50000, departureHours: [11] },

  // Surabaya international
  { fromCity: "Surabaya",      toCity: "Singapore",     airlineCode: "SQ", flightPrefix: "SQ-920", durationMin: 120, basePrice: 1600000, tax: 160000, adminFee: 25000, departureHours: [10, 16] },
  { fromCity: "Surabaya",      toCity: "Kuala Lumpur",  airlineCode: "AK", flightPrefix: "AK-720", durationMin: 135, basePrice: 1000000, tax: 100000, adminFee: 25000, departureHours: [9] },

  // Medan international
  { fromCity: "Medan",         toCity: "Kuala Lumpur",  airlineCode: "MH", flightPrefix: "MH-720", durationMin: 50,  basePrice: 750000,  tax: 75000,  adminFee: 15000, departureHours: [8, 12, 17] },
  { fromCity: "Medan",         toCity: "Singapore",     airlineCode: "SQ", flightPrefix: "SQ-930", durationMin: 75,  basePrice: 1100000, tax: 110000, adminFee: 20000, departureHours: [9, 14] },
  { fromCity: "Kuala Lumpur",  toCity: "Medan",         airlineCode: "MH", flightPrefix: "MH-721", durationMin: 50,  basePrice: 750000,  tax: 75000,  adminFee: 15000, departureHours: [11, 15, 19] },
]

// ── How many days to generate (from epoch start) ──────────────────────────────
const START_DATE = new Date("2026-03-10T00:00:00.000Z")
const DAYS_TO_GENERATE = 45  // generate flights for 45 days

async function main() {
  console.log("🛫  Seeding flights...")

  // ── Load airport IDs by city ────────────────────────────────────────────────
  const allAirports = await prisma.airport.findMany({ select: { id: true, city: true } })
  const cityToId: Record<string, number> = {}
  for (const a of allAirports) {
    if (!cityToId[a.city]) cityToId[a.city] = a.id
  }

  // ── Load airline IDs by code ────────────────────────────────────────────────
  const allAirlines = await prisma.airline.findMany({ select: { id: true, code: true } })
  const codeToId: Record<string, number> = {}
  for (const a of allAirlines) {
    codeToId[a.code] = a.id
  }

  let created = 0
  let skipped = 0
  let flightCounter: Record<string, number> = {}

  const allRoutes = [...DOMESTIC_ROUTES, ...INTL_ROUTES]

  for (const route of allRoutes) {
    const originId = cityToId[route.fromCity]
    const destId   = cityToId[route.toCity]
    const airlineId = codeToId[route.airlineCode]

    if (!originId) { console.warn(`  ⚠ Airport not found: ${route.fromCity}`); continue }
    if (!destId)   { console.warn(`  ⚠ Airport not found: ${route.toCity}`);   continue }
    if (!airlineId){ console.warn(`  ⚠ Airline not found: ${route.airlineCode}`); continue }

    for (let day = 0; day < DAYS_TO_GENERATE; day++) {
      const baseDate = addDays(START_DATE, day)

      for (const hour of route.departureHours) {
        const departure = addHours(baseDate, hour)
        const arrival   = addHours(departure, route.durationMin / 60)

        // Generate a unique flight number
        const key = route.flightPrefix
        if (!flightCounter[key]) flightCounter[key] = 1
        const flightNumber = `${key}${String(flightCounter[key]++).padStart(3, "0")}`

        try {
          await prisma.flight.create({
            data: {
              flightNumber,
              airlineId,
              originId,
              destinationId: destId,
              departureTime: departure,
              arrivalTime:   arrival,
              duration:      route.durationMin,
              basePrice:     route.basePrice,
              tax:           route.tax,
              adminFee:      route.adminFee,
              status:        "SCHEDULED",
            },
          })
          created++
        } catch (err: any) {
          if (err?.code === "P2002") {
            skipped++ // duplicate flight number — skip silently
          } else {
            console.error(`  Error creating flight ${flightNumber}:`, err?.message)
          }
        }
      }
    }
  }

  console.log(`✅  Done! Created: ${created} flights, Skipped (duplicate): ${skipped}`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
