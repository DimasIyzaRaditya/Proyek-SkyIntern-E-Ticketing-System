import { apiRequest } from "@/lib/api-client";

export type AdminAirline = {
  id: number;
  code: string;
  name: string;
  country: string;
  logo: string | null;
};

export type AdminAirport = {
  id: number;
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export type AdminFlight = {
  id: number;
  flightNumber: string;
  airlineId: number;
  originId: number;
  destinationId: number;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  basePrice: number;
  tax: number;
  adminFee: number;
  aircraft: string | null;
  facilities: string | null;
  rules: string | null;
  status: "SCHEDULED" | "DELAYED" | "CANCELLED";
  airline: {
    id: number;
    code: string;
    name: string;
    logo: string | null;
  };
  origin: {
    id: number;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    id: number;
    name: string;
    city: string;
    country: string;
  };
};

export type AdminBooking = {
  id: number;
  bookingCode: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
  totalPrice: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  flight: {
    id: number;
    flightNumber: string;
    airline: {
      name: string;
    };
  };
  payment: {
    id: number;
    status: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
  } | null;
  ticket: {
    id: number;
  } | null;
};

export const getAdminAirlines = async () => {
  const response = await apiRequest<{ airlines: AdminAirline[] }>("/api/admin/airlines", {
    auth: true,
  });

  return response.airlines;
};

export const createAdminAirline = async (payload: { code: string; name: string; country: string; logo?: File }) => {
  const { getAuthToken } = await import("@/lib/auth");
  const { API_BASE_URL } = await import("@/lib/api-client");
  const token = getAuthToken();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  const formData = new FormData();
  formData.append("code", payload.code);
  formData.append("name", payload.name);
  formData.append("country", payload.country);
  if (payload.logo) formData.append("logo", payload.logo);

  const response = await fetch(`${API_BASE_URL}/api/admin/airlines`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(errData.message ?? "Gagal membuat maskapai.");
  }

  const data = (await response.json()) as { airline: AdminAirline };
  return data.airline;
};

export const updateAdminAirline = async (id: number, payload: { code: string; name: string; country: string; logo?: File }) => {
  const { getAuthToken } = await import("@/lib/auth");
  const { API_BASE_URL } = await import("@/lib/api-client");
  const token = getAuthToken();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  const formData = new FormData();
  formData.append("code", payload.code);
  formData.append("name", payload.name);
  formData.append("country", payload.country);
  if (payload.logo) formData.append("logo", payload.logo);

  const response = await fetch(`${API_BASE_URL}/api/admin/airlines/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Gagal mengupdate maskapai.");
  }

  const data = (await response.json()) as { airline: AdminAirline };
  return data.airline;
};

export const deleteAdminAirline = async (id: number) => {
  await apiRequest<{ message: string }>(`/api/admin/airlines/${id}`, {
    method: "DELETE",
    auth: true,
  });
};

export const getAdminAirports = async () => {
  const response = await apiRequest<{ airports: AdminAirport[] }>("/api/admin/airports", {
    auth: true,
  });

  return response.airports;
};

export const createAdminAirport = async (payload: {
  name: string;
  city: string;
  country: string;
  timezone: string;
}) => {
  const response = await apiRequest<{ airport: AdminAirport }>("/api/admin/airports", {
    method: "POST",
    auth: true,
    body: payload,
  });

  return response.airport;
};

export const updateAdminAirport = async (
  id: number,
  payload: {
    name: string;
    city: string;
    country: string;
    timezone: string;
  },
) => {
  const response = await apiRequest<{ airport: AdminAirport }>(`/api/admin/airports/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });

  return response.airport;
};

export const deleteAdminAirport = async (id: number) => {
  await apiRequest<{ message: string }>(`/api/admin/airports/${id}`, {
    method: "DELETE",
    auth: true,
  });
};

export const getAdminFlights = async () => {
  const response = await apiRequest<{ flights: AdminFlight[] }>("/api/admin/flights", {
    auth: true,
  });

  return response.flights;
};

export const createAdminFlight = async (payload: {
  flightNumber: string;
  airlineId: number;
  originId: number;
  destinationId: number;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  tax: number;
  adminFee: number;
  aircraft: string;
}) => {
  const response = await apiRequest<{ flight: AdminFlight }>("/api/admin/flights", {
    method: "POST",
    auth: true,
    body: payload,
  });

  return response.flight;
};

export const updateAdminFlight = async (
  id: number,
  payload: {
    flightNumber: string;
    airlineId: number;
    originId: number;
    destinationId: number;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    tax: number;
    adminFee: number;
    aircraft: string;
    status: "SCHEDULED" | "DELAYED" | "CANCELLED";
  },
) => {
  const response = await apiRequest<{ flight: AdminFlight }>(`/api/admin/flights/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });

  return response.flight;
};

export const deleteAdminFlight = async (id: number) => {
  await apiRequest<{ message: string }>(`/api/admin/flights/${id}`, {
    method: "DELETE",
    auth: true,
  });
};

export const getAdminBookings = async (status?: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED") => {
  const query = status ? `?status=${status}` : "";
  const response = await apiRequest<{ bookings: AdminBooking[] }>(`/api/admin/bookings${query}`, {
    auth: true,
  });

  return response.bookings;
};

export type AdminSeat = {
  id: number;
  seatId: number;
  flightId: number;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED";
  additionalPrice: number;
  seat: {
    seatNumber: string;
    seatClass: "ECONOMY" | "BUSINESS" | "FIRST";
    isExitRow: boolean;
  };
};

export const getAdminSeatMap = async (flightId: number) => {
  const response = await apiRequest<{
    seats?: AdminSeat[];
    seatMap?: {
      ECONOMY?: AdminSeat[];
      BUSINESS?: AdminSeat[];
      FIRST?: AdminSeat[];
    };
  }>(`/api/flights/${flightId}/seats`, {
    auth: true,
  });

  if (Array.isArray(response.seats)) {
    return response.seats;
  }

  const economy = response.seatMap?.ECONOMY ?? [];
  const business = response.seatMap?.BUSINESS ?? [];
  const first = response.seatMap?.FIRST ?? [];
  return [...first, ...business, ...economy];
};

export const generateAdminSeats = async (flightId: number) => {
  const response = await apiRequest<{ message: string; seats: AdminSeat[] }>("/api/admin/seats/generate", {
    method: "POST",
    auth: true,
    body: { flightId },
  });
  return response;
};

export const updateAdminSeat = async (seatId: number, payload: { status?: string; additionalPrice?: number }) => {
  const response = await apiRequest<{ message: string; seat: AdminSeat }>(`/api/admin/seats/${seatId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
  return response.seat;
};
