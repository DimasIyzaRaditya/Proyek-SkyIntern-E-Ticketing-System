import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding test data...')

  // 1. Airline
  const airline = await prisma.airline.upsert({
    where: { code: 'GA' },
    update: {},
    create: { code: 'GA', name: 'Garuda Indonesia' },
  })
  console.log('✅ Airline:', airline.id, airline.name)

  // 2. Airports
  const cgk = await prisma.airport.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'INDONESIA', timezone: 'Asia/Jakarta' },
  })
  const dps = await prisma.airport.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Ngurah Rai International Airport', city: 'Bali', country: 'INDONESIA', timezone: 'Asia/Makassar' },
  })
  console.log('✅ Airports: CGK id=', cgk.id, '| DPS id=', dps.id)

  // 3. Flight
  const flight = await prisma.flight.upsert({
    where: { flightNumber: 'GA-001' },
    update: {},
    create: {
      flightNumber: 'GA-001',
      airlineId: airline.id,
      originId: cgk.id,
      destinationId: dps.id,
      departureTime: new Date('2026-04-01T08:00:00+07:00'),
      arrivalTime: new Date('2026-04-01T11:00:00+08:00'),
      duration: 120,
      basePrice: 500000,
      tax: 50000,
      adminFee: 10000,
      aircraft: 'Boeing 737-800',
      status: 'SCHEDULED',
    },
  })
  console.log('✅ Flight:', flight.id, flight.flightNumber)

  // 4. Seats (10 economy seats)
  const seats = []
  for (let i = 1; i <= 10; i++) {
    const seatNumber = `${String.fromCharCode(64 + Math.ceil(i / 2))}${i % 2 === 1 ? '1' : '2'}`
    const seat = await prisma.seat.upsert({
      where: { seatNumber_seatClass: { seatNumber, seatClass: 'ECONOMY' } },
      update: {},
      create: { seatNumber, seatClass: 'ECONOMY' },
    })
    await prisma.flightSeat.upsert({
      where: { flightId_seatId: { flightId: flight.id, seatId: seat.id } },
      update: {},
      create: { flightId: flight.id, seatId: seat.id, status: 'AVAILABLE', additionalPrice: 0 },
    })
    seats.push(seatNumber)
  }
  console.log('✅ Seats:', seats.join(', '))

  console.log('\n🎉 Seed complete!')
  console.log(`   Flight ID untuk testing: ${flight.id}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
