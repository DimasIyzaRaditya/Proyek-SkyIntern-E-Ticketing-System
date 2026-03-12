/**
 * Seed major world airports into the database.
 * Run: npx ts-node prisma/seed-airports.ts
 *  or: npx tsx prisma/seed-airports.ts
 *
 * Uses upsert-by-name+city logic to avoid duplicates on re-run.
 */
import "dotenv/config"
import prisma from "../src/prisma/client"

type AirportSeed = {
  name: string
  city: string
  country: string
  timezone: string
}

const airports: AirportSeed[] = [
  // ── Indonesia ────────────────────────────────────────────────────────────
  { name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Ngurah Rai International Airport", city: "Denpasar", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Juanda International Airport", city: "Surabaya", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Kualanamu International Airport", city: "Medan", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Sultan Hasanuddin International Airport", city: "Makassar", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Adisutjipto International Airport", city: "Yogyakarta", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Adi Soemarmo International Airport", city: "Solo", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Ahmad Yani International Airport", city: "Semarang", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Syamsudin Noor International Airport", city: "Banjarmasin", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Sepinggan International Airport", city: "Balikpapan", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Aji Pangeran Tumenggung Pranoto Airport", city: "Samarinda", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Sam Ratulangi International Airport", city: "Manado", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Pattimura International Airport", city: "Ambon", country: "Indonesia", timezone: "Asia/Jayapura" },
  { name: "Frans Kaisiepo International Airport", city: "Biak", country: "Indonesia", timezone: "Asia/Jayapura" },
  { name: "Sentani International Airport", city: "Jayapura", country: "Indonesia", timezone: "Asia/Jayapura" },
  { name: "El Tari International Airport", city: "Kupang", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Lombok International Airport", city: "Lombok", country: "Indonesia", timezone: "Asia/Makassar" },
  { name: "Hang Nadim International Airport", city: "Batam", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Sultan Mahmud Badaruddin II International Airport", city: "Palembang", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Sultan Thaha Airport", city: "Jambi", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Sultan Iskandar Muda International Airport", city: "Banda Aceh", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Minangkabau International Airport", city: "Padang", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Sultan Syarif Kasim II International Airport", city: "Pekanbaru", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Radin Inten II National Airport", city: "Bandar Lampung", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Supadio International Airport", city: "Pontianak", country: "Indonesia", timezone: "Asia/Jakarta" },
  { name: "Tjilik Riwut Airport", city: "Palangkaraya", country: "Indonesia", timezone: "Asia/Jakarta" },

  // ── Southeast Asia ────────────────────────────────────────────────────────
  { name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", timezone: "Asia/Singapore" },
  { name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", timezone: "Asia/Kuala_Lumpur" },
  { name: "Kota Kinabalu International Airport", city: "Kota Kinabalu", country: "Malaysia", timezone: "Asia/Kuching" },
  { name: "Kuching International Airport", city: "Kuching", country: "Malaysia", timezone: "Asia/Kuching" },
  { name: "Penang International Airport", city: "Penang", country: "Malaysia", timezone: "Asia/Kuala_Lumpur" },
  { name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
  { name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
  { name: "Phuket International Airport", city: "Phuket", country: "Thailand", timezone: "Asia/Bangkok" },
  { name: "Chiang Mai International Airport", city: "Chiang Mai", country: "Thailand", timezone: "Asia/Bangkok" },
  { name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", timezone: "Asia/Manila" },
  { name: "Mactan–Cebu International Airport", city: "Cebu", country: "Philippines", timezone: "Asia/Manila" },
  { name: "Yangon International Airport", city: "Yangon", country: "Myanmar", timezone: "Asia/Rangoon" },
  { name: "Phnom Penh International Airport", city: "Phnom Penh", country: "Cambodia", timezone: "Asia/Phnom_Penh" },
  { name: "Vientiane Wattay International Airport", city: "Vientiane", country: "Laos", timezone: "Asia/Vientiane" },
  { name: "Brunei International Airport", city: "Bandar Seri Begawan", country: "Brunei", timezone: "Asia/Brunei" },

  // ── East Asia ─────────────────────────────────────────────────────────────
  { name: "Tokyo Narita International Airport", city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Osaka Kansai International Airport", city: "Osaka", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Osaka Itami Airport", city: "Osaka", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Fukuoka Airport", city: "Fukuoka", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Sapporo New Chitose Airport", city: "Sapporo", country: "Japan", timezone: "Asia/Tokyo" },
  { name: "Incheon International Airport", city: "Seoul", country: "South Korea", timezone: "Asia/Seoul" },
  { name: "Gimpo International Airport", city: "Seoul", country: "South Korea", timezone: "Asia/Seoul" },
  { name: "Gimhae International Airport", city: "Busan", country: "South Korea", timezone: "Asia/Seoul" },
  { name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", timezone: "Asia/Taipei" },
  { name: "Taipei Songshan Airport", city: "Taipei", country: "Taiwan", timezone: "Asia/Taipei" },
  { name: "Beijing Capital International Airport", city: "Beijing", country: "China", timezone: "Asia/Shanghai" },
  { name: "Beijing Daxing International Airport", city: "Beijing", country: "China", timezone: "Asia/Shanghai" },
  { name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", timezone: "Asia/Shanghai" },
  { name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China", timezone: "Asia/Shanghai" },
  { name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", timezone: "Asia/Shanghai" },
  { name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "China", timezone: "Asia/Shanghai" },
  { name: "Chengdu Tianfu International Airport", city: "Chengdu", country: "China", timezone: "Asia/Shanghai" },
  { name: "Kunming Changshui International Airport", city: "Kunming", country: "China", timezone: "Asia/Shanghai" },
  { name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", timezone: "Asia/Hong_Kong" },
  { name: "Macau International Airport", city: "Macau", country: "Macau", timezone: "Asia/Macau" },

  // ── South Asia ────────────────────────────────────────────────────────────
  { name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", timezone: "Asia/Kolkata" },
  { name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", timezone: "Asia/Kolkata" },
  { name: "Kempegowda International Airport", city: "Bangalore", country: "India", timezone: "Asia/Kolkata" },
  { name: "Chennai International Airport", city: "Chennai", country: "India", timezone: "Asia/Kolkata" },
  { name: "Cochin International Airport", city: "Kochi", country: "India", timezone: "Asia/Kolkata" },
  { name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", timezone: "Asia/Kolkata" },
  { name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", timezone: "Asia/Dhaka" },
  { name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", timezone: "Asia/Kathmandu" },
  { name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", timezone: "Asia/Colombo" },
  { name: "Jinnah International Airport", city: "Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
  { name: "Allama Iqbal International Airport", city: "Lahore", country: "Pakistan", timezone: "Asia/Karachi" },
  { name: "Islamabad International Airport", city: "Islamabad", country: "Pakistan", timezone: "Asia/Karachi" },

  // ── Middle East ───────────────────────────────────────────────────────────
  { name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai" },
  { name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates", timezone: "Asia/Dubai" },
  { name: "Hamad International Airport", city: "Doha", country: "Qatar", timezone: "Asia/Qatar" },
  { name: "King Fahd International Airport", city: "Dammam", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { name: "Queen Alia International Airport", city: "Amman", country: "Jordan", timezone: "Asia/Amman" },
  { name: "Bahrain International Airport", city: "Manama", country: "Bahrain", timezone: "Asia/Bahrain" },
  { name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", timezone: "Asia/Kuwait" },
  { name: "Muscat International Airport", city: "Muscat", country: "Oman", timezone: "Asia/Muscat" },
  { name: "Ben Gurion International Airport", city: "Tel Aviv", country: "Israel", timezone: "Asia/Jerusalem" },
  { name: "Istanbul Airport", city: "Istanbul", country: "Turkey", timezone: "Europe/Istanbul" },
  { name: "Sabiha Gokcen International Airport", city: "Istanbul", country: "Turkey", timezone: "Europe/Istanbul" },
  { name: "Beirut Rafic Hariri International Airport", city: "Beirut", country: "Lebanon", timezone: "Asia/Beirut" },

  // ── Europe ────────────────────────────────────────────────────────────────
  { name: "London Heathrow Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { name: "London Gatwick Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { name: "London Stansted Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { name: "Manchester Airport", city: "Manchester", country: "United Kingdom", timezone: "Europe/London" },
  { name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", timezone: "Europe/London" },
  { name: "Charles de Gaulle Airport", city: "Paris", country: "France", timezone: "Europe/Paris" },
  { name: "Orly Airport", city: "Paris", country: "France", timezone: "Europe/Paris" },
  { name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", timezone: "Europe/Paris" },
  { name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", timezone: "Europe/Berlin" },
  { name: "Munich Airport", city: "Munich", country: "Germany", timezone: "Europe/Berlin" },
  { name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", timezone: "Europe/Berlin" },
  { name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", timezone: "Europe/Amsterdam" },
  { name: "Madrid Barajas Airport", city: "Madrid", country: "Spain", timezone: "Europe/Madrid" },
  { name: "Barcelona El Prat Airport", city: "Barcelona", country: "Spain", timezone: "Europe/Madrid" },
  { name: "Rome Fiumicino Airport", city: "Rome", country: "Italy", timezone: "Europe/Rome" },
  { name: "Milan Malpensa Airport", city: "Milan", country: "Italy", timezone: "Europe/Rome" },
  { name: "Zurich Airport", city: "Zurich", country: "Switzerland", timezone: "Europe/Zurich" },
  { name: "Vienna International Airport", city: "Vienna", country: "Austria", timezone: "Europe/Vienna" },
  { name: "Brussels Airport", city: "Brussels", country: "Belgium", timezone: "Europe/Brussels" },
  { name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", timezone: "Europe/Copenhagen" },
  { name: "Oslo Gardermoen Airport", city: "Oslo", country: "Norway", timezone: "Europe/Oslo" },
  { name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", timezone: "Europe/Stockholm" },
  { name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", timezone: "Europe/Helsinki" },
  { name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", timezone: "Europe/Warsaw" },
  { name: "Prague Václav Havel Airport", city: "Prague", country: "Czech Republic", timezone: "Europe/Prague" },
  { name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", timezone: "Europe/Budapest" },
  { name: "Athens International Airport", city: "Athens", country: "Greece", timezone: "Europe/Athens" },
  { name: "Lisbon Airport", city: "Lisbon", country: "Portugal", timezone: "Europe/Lisbon" },
  { name: "Dublin Airport", city: "Dublin", country: "Ireland", timezone: "Europe/Dublin" },
  { name: "Moscow Sheremetyevo International Airport", city: "Moscow", country: "Russia", timezone: "Europe/Moscow" },
  { name: "Moscow Domodedovo Airport", city: "Moscow", country: "Russia", timezone: "Europe/Moscow" },
  { name: "St. Petersburg Pulkovo Airport", city: "St. Petersburg", country: "Russia", timezone: "Europe/Moscow" },
  { name: "Kyiv Boryspil International Airport", city: "Kyiv", country: "Ukraine", timezone: "Europe/Kyiv" },
  { name: "Bucharest Henri Coandă International Airport", city: "Bucharest", country: "Romania", timezone: "Europe/Bucharest" },
  { name: "Sofia Airport", city: "Sofia", country: "Bulgaria", timezone: "Europe/Sofia" },
  { name: "Zagreb Airport", city: "Zagreb", country: "Croatia", timezone: "Europe/Zagreb" },
  { name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia", timezone: "Europe/Belgrade" },

  // ── North America ─────────────────────────────────────────────────────────
  { name: "John F. Kennedy International Airport", city: "New York", country: "United States", timezone: "America/New_York" },
  { name: "LaGuardia Airport", city: "New York", country: "United States", timezone: "America/New_York" },
  { name: "Newark Liberty International Airport", city: "Newark", country: "United States", timezone: "America/New_York" },
  { name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", timezone: "America/Los_Angeles" },
  { name: "San Francisco International Airport", city: "San Francisco", country: "United States", timezone: "America/Los_Angeles" },
  { name: "O'Hare International Airport", city: "Chicago", country: "United States", timezone: "America/Chicago" },
  { name: "Midway International Airport", city: "Chicago", country: "United States", timezone: "America/Chicago" },
  { name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States", timezone: "America/New_York" },
  { name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", timezone: "America/Chicago" },
  { name: "Denver International Airport", city: "Denver", country: "United States", timezone: "America/Denver" },
  { name: "Miami International Airport", city: "Miami", country: "United States", timezone: "America/New_York" },
  { name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States", timezone: "America/Los_Angeles" },
  { name: "Boston Logan International Airport", city: "Boston", country: "United States", timezone: "America/New_York" },
  { name: "McCarran International Airport", city: "Las Vegas", country: "United States", timezone: "America/Los_Angeles" },
  { name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States", timezone: "America/Phoenix" },
  { name: "Honolulu Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", timezone: "Pacific/Honolulu" },
  { name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", timezone: "America/Toronto" },
  { name: "Vancouver International Airport", city: "Vancouver", country: "Canada", timezone: "America/Vancouver" },
  { name: "Montreal-Pierre Elliott Trudeau International Airport", city: "Montreal", country: "Canada", timezone: "America/Toronto" },
  { name: "Calgary International Airport", city: "Calgary", country: "Canada", timezone: "America/Edmonton" },
  { name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", timezone: "America/Mexico_City" },
  { name: "Cancún International Airport", city: "Cancún", country: "Mexico", timezone: "America/Cancun" },

  // ── Central & South America ───────────────────────────────────────────────
  { name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", timezone: "America/Bogota" },
  { name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", timezone: "America/Lima" },
  { name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
  { name: "Guarulhos International Airport", city: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo" },
  { name: "Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", timezone: "America/Sao_Paulo" },
  { name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", timezone: "America/Santiago" },
  { name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", timezone: "America/Caracas" },
  { name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", timezone: "America/Guayaquil" },
  { name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "Ecuador", timezone: "America/Guayaquil" },
  { name: "Tocumen International Airport", city: "Panama City", country: "Panama", timezone: "America/Panama" },
  { name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", timezone: "America/Costa_Rica" },

  // ── Africa ────────────────────────────────────────────────────────────────
  { name: "Cairo International Airport", city: "Cairo", country: "Egypt", timezone: "Africa/Cairo" },
  { name: "O. R. Tambo International Airport", city: "Johannesburg", country: "South Africa", timezone: "Africa/Johannesburg" },
  { name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", timezone: "Africa/Johannesburg" },
  { name: "Bole International Airport", city: "Addis Ababa", country: "Ethiopia", timezone: "Africa/Addis_Ababa" },
  { name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", timezone: "Africa/Nairobi" },
  { name: "Lagos Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", timezone: "Africa/Lagos" },
  { name: "Abuja Nnamdi Azikiwe International Airport", city: "Abuja", country: "Nigeria", timezone: "Africa/Lagos" },
  { name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", timezone: "Africa/Casablanca" },
  { name: "Tunis-Carthage International Airport", city: "Tunis", country: "Tunisia", timezone: "Africa/Tunis" },
  { name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", timezone: "Africa/Algiers" },
  { name: "Entebbe International Airport", city: "Entebbe", country: "Uganda", timezone: "Africa/Nairobi" },
  { name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania", timezone: "Africa/Dar_es_Salaam" },
  { name: "Kotoka International Airport", city: "Accra", country: "Ghana", timezone: "Africa/Accra" },
  { name: "Léopold Sédar Senghor International Airport", city: "Dakar", country: "Senegal", timezone: "Africa/Dakar" },

  // ── Oceania ───────────────────────────────────────────────────────────────
  { name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", timezone: "Australia/Sydney" },
  { name: "Melbourne Airport", city: "Melbourne", country: "Australia", timezone: "Australia/Melbourne" },
  { name: "Brisbane Airport", city: "Brisbane", country: "Australia", timezone: "Australia/Brisbane" },
  { name: "Perth Airport", city: "Perth", country: "Australia", timezone: "Australia/Perth" },
  { name: "Adelaide Airport", city: "Adelaide", country: "Australia", timezone: "Australia/Adelaide" },
  { name: "Auckland Airport", city: "Auckland", country: "New Zealand", timezone: "Pacific/Auckland" },
  { name: "Wellington Airport", city: "Wellington", country: "New Zealand", timezone: "Pacific/Auckland" },
  { name: "Christchurch Airport", city: "Christchurch", country: "New Zealand", timezone: "Pacific/Auckland" },
  { name: "Nadi International Airport", city: "Nadi", country: "Fiji", timezone: "Pacific/Fiji" },
  { name: "Papeete Faa'a International Airport", city: "Papeete", country: "French Polynesia", timezone: "Pacific/Tahiti" },
]

async function main() {
  console.log(`Seeding ${airports.length} world airports…`)
  let created = 0
  let skipped = 0

  for (const ap of airports) {
    // Skip if airport with same name+city already exists
    const existing = await prisma.airport.findFirst({
      where: { name: ap.name, city: ap.city }
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.airport.create({
      data: {
        name: ap.name,
        city: ap.city,
        country: ap.country,
        timezone: ap.timezone
      }
    })
    created++
  }

  console.log(`✅ World airports seed complete: ${created} created, ${skipped} already existed.`)
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
