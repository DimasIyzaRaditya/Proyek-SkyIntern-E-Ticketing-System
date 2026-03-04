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

export const createAdminAirline = async (payload: { code: string; name: string; country: string }) => {
  const response = await apiRequest<{ airline: AdminAirline }>("/api/admin/airlines", {
    method: "POST",
    auth: true,
    body: payload,
  });

  return response.airline;
};

export const updateAdminAirline = async (id: number, payload: { code: string; name: string; country: string }) => {
  const response = await apiRequest<{ airline: AdminAirline }>(`/api/admin/airlines/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });

  return response.airline;
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
