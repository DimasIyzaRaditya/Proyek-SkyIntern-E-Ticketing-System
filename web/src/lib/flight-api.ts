export type FlightCardItem = {
  id: string;
  flightNumber: string;
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

type BackendFlight = {
  id: number;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  basePrice: number;
  tax?: number;
  adminFee?: number;
  aircraft?: string | null;
  facilities?: string | null;
  airline: {
    name: string;
    logo?: string | null;
  };
  origin: {
    city: string;
    country: string;
    name: string;
  };
  destination: {
    city: string;
    country: string;
    name: string;
  };
};

type SearchFlightsResponse = {
  flights: BackendFlight[];
  count: number;
  passengers: number;
};

type GetFlightDetailResponse = {
  flight: BackendFlight;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const extractCity = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "";

  const withDash = normalized.split(" - ")[1];
  if (withDash?.trim()) return withDash.trim().toLowerCase();

  const withoutCode = normalized.replace(/\s*\([A-Z]{3}\)\s*$/, "");
  const city = withoutCode.split(",")[0]?.trim();
  return (city || withoutCode).toLowerCase();
};

const mapSortToApi = (sortBy: "price-low" | "price-high" | "duration" | "departure") => {
  if (sortBy === "price-low") return "price-asc";
  if (sortBy === "price-high") return "price-desc";
  if (sortBy === "duration") return "duration-asc";
  return "time-asc";
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
};

const parseFacilities = (value?: string | null) => {
  if (!value) return ["Cabin Bag 7kg"];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toCardItem = (flight: BackendFlight): FlightCardItem => ({
  id: String(flight.id),
  flightNumber: flight.flightNumber,
  airline: flight.airline.name,
  logo: flight.airline.logo?.trim() || "✈️",
  aircraft: flight.aircraft || "Aircraft",
  origin: `${flight.origin.city}`,
  destination: `${flight.destination.city}`,
  departureTime: formatTime(flight.departureTime),
  arrivalTime: formatTime(flight.arrivalTime),
  duration: formatDuration(flight.duration),
  price: flight.basePrice + (flight.tax ?? 0) + (flight.adminFee ?? 0),
  facilities: parseFacilities(flight.facilities),
});

export const searchFlightsFromApi = async (params: {
  origin: string;
  destination: string;
  departureDate: string;
  adult: string;
  child: string;
  sortBy: "price-low" | "price-high" | "duration" | "departure";
}) => {
  const passengerCount = Math.max(1, Number(params.adult || "1") + Number(params.child || "0"));

  const query = new URLSearchParams({
    departureDate: params.departureDate,
    passengerCount: String(passengerCount),
    sortBy: mapSortToApi(params.sortBy),
  });

  const response = await fetch(`${API_BASE_URL}/api/flights/search?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data penerbangan dari backend.");
  }

  const payload = (await response.json()) as SearchFlightsResponse;
  const originCity = extractCity(params.origin);
  const destinationCity = extractCity(params.destination);

  const filtered = payload.flights.filter((item) => {
    const matchedOrigin = originCity ? item.origin.city.toLowerCase() === originCity : true;
    const matchedDestination = destinationCity ? item.destination.city.toLowerCase() === destinationCity : true;
    return matchedOrigin && matchedDestination;
  });

  return filtered.map(toCardItem);
};

export const getFlightDetailFromApi = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/flights/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Flight tidak ditemukan di backend.");
  }

  const payload = (await response.json()) as GetFlightDetailResponse;
  return toCardItem(payload.flight);
};
