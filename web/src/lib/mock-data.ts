export type Flight = {
  id: string;
  airline: string;
  logo: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  facilities: string[];
};

export type BookingItem = {
  id: string;
  airline: string;
  route: string;
  date: string;
  status: "Pending" | "Paid" | "Issued" | "Cancelled";
  seat: string;
  passenger: string;
  flightNumber: string;
  pdfUrl: string;
};

export type AirportItem = {
  code: string;
  name: string;
  location: string;
};

export type AirlineItem = {
  id: string;
  name: string;
  logo: string;
};

export type ScheduleItem = {
  id: string;
  origin: string;
  destination: string;
  basePrice: number;
  departureTime: string;
  arrivalTime: string;
};

export type TransactionItem = {
  id: string;
  customer: string;
  flight: string;
  amount: number;
  status: "Pending" | "Paid" | "Issued";
};

export const cities = [
  "CGK - Jakarta",
  "DPS - Denpasar",
  "SUB - Surabaya",
  "YIA - Yogyakarta",
  "KNO - Medan",
  "UPG - Makassar",
  "BDO - Bandung",
  "PLM - Palembang",
  "BPN - Balikpapan",
  "LOP - Lombok",
  "SRG - Semarang",
  "PKU - Pekanbaru",
];

export const flights: Flight[] = [
  {
    id: "FL001",
    airline: "Garuda Indonesia",
    logo: "🦅",
    aircraft: "Boeing 737-800",
    origin: "CGK - Jakarta",
    destination: "DPS - Denpasar",
    departureTime: "07:30",
    arrivalTime: "09:45",
    duration: "2j 15m",
    price: 1250000,
    facilities: ["Cabin Bag 7kg", "Snack", "USB Charging"],
  },
  {
    id: "FL002",
    airline: "Lion Air",
    logo: "🦁",
    aircraft: "Boeing 737-900ER",
    origin: "CGK - Jakarta",
    destination: "DPS - Denpasar",
    departureTime: "10:15",
    arrivalTime: "12:30",
    duration: "2j 15m",
    price: 980000,
    facilities: ["Cabin Bag 7kg", "Online Check-in"],
  },
  {
    id: "FL003",
    airline: "Citilink",
    logo: "✈️",
    aircraft: "Airbus A320",
    origin: "CGK - Jakarta",
    destination: "DPS - Denpasar",
    departureTime: "13:05",
    arrivalTime: "15:20",
    duration: "2j 15m",
    price: 890000,
    facilities: ["Cabin Bag 7kg", "Seat Pitch Comfort"],
  },
  {
    id: "FL004",
    airline: "Batik Air",
    logo: "🛫",
    aircraft: "Airbus A320neo",
    origin: "CGK - Jakarta",
    destination: "YIA - Yogyakarta",
    departureTime: "08:40",
    arrivalTime: "09:50",
    duration: "1j 10m",
    price: 760000,
    facilities: ["Cabin Bag 7kg", "In-flight Entertainment"],
  },
  {
    id: "FL005",
    airline: "Super Air Jet",
    logo: "🛩️",
    aircraft: "Airbus A320",
    origin: "CGK - Jakarta",
    destination: "KNO - Medan",
    departureTime: "06:10",
    arrivalTime: "08:35",
    duration: "2j 25m",
    price: 1120000,
    facilities: ["Cabin Bag 7kg", "Mobile Check-in"],
  },
  {
    id: "FL006",
    airline: "Garuda Indonesia",
    logo: "🦅",
    aircraft: "Boeing 737-800",
    origin: "SUB - Surabaya",
    destination: "DPS - Denpasar",
    departureTime: "14:20",
    arrivalTime: "15:20",
    duration: "1j 0m",
    price: 690000,
    facilities: ["Cabin Bag 7kg", "Snack"],
  },
  {
    id: "FL007",
    airline: "Citilink",
    logo: "✈️",
    aircraft: "Airbus A320",
    origin: "CGK - Jakarta",
    destination: "UPG - Makassar",
    departureTime: "09:25",
    arrivalTime: "12:45",
    duration: "3j 20m",
    price: 1460000,
    facilities: ["Cabin Bag 7kg", "Power Outlet"],
  },
  {
    id: "FL008",
    airline: "Lion Air",
    logo: "🦁",
    aircraft: "Boeing 737-900ER",
    origin: "BDO - Bandung",
    destination: "DPS - Denpasar",
    departureTime: "11:05",
    arrivalTime: "12:55",
    duration: "1j 50m",
    price: 870000,
    facilities: ["Cabin Bag 7kg", "Online Check-in"],
  },
  {
    id: "FL009",
    airline: "AirAsia Indonesia",
    logo: "🔴",
    aircraft: "Airbus A320",
    origin: "CGK - Jakarta",
    destination: "LOP - Lombok",
    departureTime: "16:15",
    arrivalTime: "18:00",
    duration: "1j 45m",
    price: 940000,
    facilities: ["Cabin Bag 7kg", "Hot Meal Optional"],
  },
  {
    id: "FL010",
    airline: "Batik Air",
    logo: "🛫",
    aircraft: "Boeing 737-800",
    origin: "CGK - Jakarta",
    destination: "PLM - Palembang",
    departureTime: "19:35",
    arrivalTime: "20:35",
    duration: "1j 0m",
    price: 620000,
    facilities: ["Cabin Bag 7kg", "Snack"],
  },
  {
    id: "FL011",
    airline: "Garuda Indonesia",
    logo: "🦅",
    aircraft: "Boeing 737-800",
    origin: "CGK - Jakarta",
    destination: "BPN - Balikpapan",
    departureTime: "05:50",
    arrivalTime: "08:55",
    duration: "2j 5m",
    price: 1320000,
    facilities: ["Cabin Bag 7kg", "Snack", "Extra Legroom Option"],
  },
  {
    id: "FL012",
    airline: "Citilink",
    logo: "✈️",
    aircraft: "Airbus A320",
    origin: "SRG - Semarang",
    destination: "DPS - Denpasar",
    departureTime: "07:05",
    arrivalTime: "08:35",
    duration: "1j 30m",
    price: 780000,
    facilities: ["Cabin Bag 7kg", "Seat Pitch Comfort"],
  },
];

export const bookingSamples: BookingItem[] = [
  {
    id: "BK-001",
    airline: "Garuda Indonesia",
    route: "CGK → DPS",
    date: "15 Mar 2026",
    status: "Issued",
    seat: "12A",
    passenger: "Abimanyu Pratama",
    flightNumber: "GA-123",
    pdfUrl: "https://minio.skyintern.local/e-ticket/BK-001.pdf",
  },
  {
    id: "BK-002",
    airline: "Citilink",
    route: "CGK → SUB",
    date: "20 Mar 2026",
    status: "Paid",
    seat: "09C",
    passenger: "Abimanyu Pratama",
    flightNumber: "QG-212",
    pdfUrl: "https://minio.skyintern.local/e-ticket/BK-002.pdf",
  },
  {
    id: "BK-003",
    airline: "Lion Air",
    route: "CGK → YIA",
    date: "28 Mar 2026",
    status: "Pending",
    seat: "14F",
    passenger: "Abimanyu Pratama",
    flightNumber: "JT-554",
    pdfUrl: "https://minio.skyintern.local/e-ticket/BK-003.pdf",
  },
  {
    id: "BK-004",
    airline: "Batik Air",
    route: "CGK → KNO",
    date: "03 Apr 2026",
    status: "Cancelled",
    seat: "07D",
    passenger: "Abimanyu Pratama",
    flightNumber: "ID-770",
    pdfUrl: "https://minio.skyintern.local/e-ticket/BK-004.pdf",
  },
];

export const airportSamples: AirportItem[] = [
  { code: "CGK", name: "Soekarno-Hatta", location: "Tangerang" },
  { code: "DPS", name: "Ngurah Rai", location: "Bali" },
  { code: "SUB", name: "Juanda", location: "Surabaya" },
];

export const airlineSamples: AirlineItem[] = [
  { id: "AL001", name: "Garuda Indonesia", logo: "🦅" },
  { id: "AL002", name: "Lion Air", logo: "🦁" },
  { id: "AL003", name: "Citilink", logo: "✈️" },
];

export const scheduleSamples: ScheduleItem[] = [
  {
    id: "SCH001",
    origin: "CGK",
    destination: "DPS",
    basePrice: 1250000,
    departureTime: "07:30",
    arrivalTime: "09:45",
  },
  {
    id: "SCH002",
    origin: "CGK",
    destination: "SUB",
    basePrice: 920000,
    departureTime: "11:00",
    arrivalTime: "12:25",
  },
];

export const transactionSamples: TransactionItem[] = [
  { id: "TX-001", customer: "Abimanyu Pratama", flight: "GA-123", amount: 1435000, status: "Issued" },
  { id: "TX-002", customer: "Nadia Putri", flight: "JT-554", amount: 985000, status: "Paid" },
  { id: "TX-003", customer: "Rizki Hidayat", flight: "QG-212", amount: 925000, status: "Pending" },
];

export const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
