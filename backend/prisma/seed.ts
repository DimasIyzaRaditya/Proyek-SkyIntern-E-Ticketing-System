import "dotenv/config"
import prisma from "../src/prisma/client"

type AirlineSeed = {
  code: string
  name: string
  country: string
}

const airlines: AirlineSeed[] = [
  { code: "GA", name: "Garuda Indonesia", country: "Indonesia" },
  { code: "QG", name: "Citilink", country: "Indonesia" },
  { code: "JT", name: "Lion Air", country: "Indonesia" },
  { code: "ID", name: "Batik Air", country: "Indonesia" },
  { code: "SQ", name: "Singapore Airlines", country: "Singapore" },
  { code: "TR", name: "Scoot", country: "Singapore" },
  { code: "MH", name: "Malaysia Airlines", country: "Malaysia" },
  { code: "AK", name: "AirAsia", country: "Malaysia" },
  { code: "TG", name: "Thai Airways", country: "Thailand" },
  { code: "FD", name: "Thai AirAsia", country: "Thailand" },
  { code: "VN", name: "Vietnam Airlines", country: "Vietnam" },
  { code: "VJ", name: "VietJet Air", country: "Vietnam" },
  { code: "CX", name: "Cathay Pacific", country: "Hong Kong" },
  { code: "KA", name: "HK Express", country: "Hong Kong" },
  { code: "JL", name: "Japan Airlines", country: "Japan" },
  { code: "NH", name: "All Nippon Airways", country: "Japan" },
  { code: "KE", name: "Korean Air", country: "South Korea" },
  { code: "OZ", name: "Asiana Airlines", country: "South Korea" },
  { code: "CI", name: "China Airlines", country: "Taiwan" },
  { code: "BR", name: "EVA Air", country: "Taiwan" },
  { code: "CA", name: "Air China", country: "China" },
  { code: "MU", name: "China Eastern Airlines", country: "China" },
  { code: "EK", name: "Emirates", country: "United Arab Emirates" },
  { code: "EY", name: "Etihad Airways", country: "United Arab Emirates" },
  { code: "QR", name: "Qatar Airways", country: "Qatar" },
  { code: "SV", name: "Saudia", country: "Saudi Arabia" },
  { code: "TK", name: "Turkish Airlines", country: "Turkey" },
  { code: "BA", name: "British Airways", country: "United Kingdom" },
  { code: "LH", name: "Lufthansa", country: "Germany" },
  { code: "AF", name: "Air France", country: "France" },
  { code: "KL", name: "KLM", country: "Netherlands" },
  { code: "AZ", name: "ITA Airways", country: "Italy" },
  { code: "IB", name: "Iberia", country: "Spain" },
  { code: "SK", name: "Scandinavian Airlines", country: "Sweden" },
  { code: "SU", name: "Aeroflot", country: "Russia" },
  { code: "AA", name: "American Airlines", country: "United States" },
  { code: "DL", name: "Delta Air Lines", country: "United States" },
  { code: "UA", name: "United Airlines", country: "United States" },
  { code: "AC", name: "Air Canada", country: "Canada" },
  { code: "AM", name: "Aeromexico", country: "Mexico" },
  { code: "LA", name: "LATAM Airlines", country: "Chile" },
  { code: "AR", name: "Aerolineas Argentinas", country: "Argentina" },
  { code: "QF", name: "Qantas", country: "Australia" },
  { code: "NZ", name: "Air New Zealand", country: "New Zealand" },
  { code: "SA", name: "South African Airways", country: "South Africa" },
  { code: "ET", name: "Ethiopian Airlines", country: "Ethiopia" },
  { code: "MS", name: "EgyptAir", country: "Egypt" }
]

async function main() {
  for (const airline of airlines) {
    await prisma.airline.upsert({
      where: { code: airline.code },
      update: {
        name: airline.name,
        country: airline.country
      },
      create: {
        code: airline.code,
        name: airline.name,
        country: airline.country
      }
    })
  }

  const uniqueCountries = new Set(airlines.map((airline) => airline.country))
  console.log(`Seed berhasil: ${airlines.length} maskapai dari ${uniqueCountries.size} negara.`)
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
