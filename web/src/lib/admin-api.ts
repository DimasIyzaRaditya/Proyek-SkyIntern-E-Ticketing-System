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
  cityImageUrl: string | null;
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

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export const getAdminAirlines = async () => {
  const response = await apiRequest<{ airlines: AdminAirline[] }>("/api/admin/airlines", {
    auth: true,
  });

  return response.airlines;
};

export const getAdminAirlinesPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "id" | "code" | "name" | "country";
  sortDirection?: "asc" | "desc";
}): Promise<PaginatedResult<AdminAirline>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<{ airlines: AdminAirline[]; pagination: PaginationMeta }>(
    `/api/admin/airlines?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.airlines,
    pagination: response.pagination,
  };
};

export const getAdminAirlineById = async (id: number) => {
  const response = await apiRequest<{ airline: AdminAirline }>(`/api/admin/airlines/${id}`, {
    auth: true,
  });

  return response.airline;
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
    if (payload.logo && errData.message === "Terjadi kesalahan pada server") {
      throw new Error("Logo upload service is unavailable. Please start MinIO server (port 9000) and try again.");
    }
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
    if (payload.logo && data.message === "Terjadi kesalahan pada server") {
      throw new Error("Logo upload service is unavailable. Please start MinIO server (port 9000) and try again.");
    }
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

export const getAdminAirportsPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "id" | "name" | "city" | "country" | "timezone";
  sortDirection?: "asc" | "desc";
}): Promise<PaginatedResult<AdminAirport>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<{ airports: AdminAirport[]; pagination: PaginationMeta }>(
    `/api/admin/airports?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.airports,
    pagination: response.pagination,
  };
};

export const getAdminAirportById = async (id: number) => {
  const airports = await getAdminAirports();
  const airport = airports.find((item) => item.id === id);

  if (!airport) {
    throw new Error("Airport not found.");
  }

  return airport;
};

export const createAdminAirport = async (payload: {
  name: string;
  city: string;
  country: string;
  timezone: string;
  cityImageUrl?: string;
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
    cityImageUrl?: string;
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

export const uploadAdminAirportCityImage = async (id: number, file: File): Promise<string> => {
  const { getAuthToken } = await import("@/lib/auth");
  const { API_BASE_URL } = await import("@/lib/api-client");
  const token = getAuthToken();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/admin/airports/${id}/city-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(errData.message ?? "Gagal mengupload foto kota.");
  }

  const data = (await response.json()) as { cityImageUrl: string };
  return data.cityImageUrl;
};

export const getAdminFlights = async () => {
  const response = await apiRequest<{ flights: AdminFlight[] }>("/api/admin/flights", {
    auth: true,
  });

  return response.flights;
};

export const getAdminFlightsPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "flightNumber" | "route" | "basePrice" | "departureTime" | "arrivalTime";
  sortDirection?: "asc" | "desc";
}): Promise<PaginatedResult<AdminFlight>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<{ flights: AdminFlight[]; pagination: PaginationMeta }>(
    `/api/admin/flights?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.flights,
    pagination: response.pagination,
  };
};

export const getAdminFlightById = async (id: number) => {
  const flights = await getAdminFlights();
  const flight = flights.find((item) => item.id === id);

  if (!flight) {
    throw new Error("Flight not found.");
  }

  return flight;
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

export const getAdminBookingsPage = async (params: {
  page: number;
  limit: number;
  statusFilter?: "All" | "Pending" | "Paid" | "Issued" | "Cancelled";
  search?: string;
}): Promise<PaginatedResult<AdminBooking>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.statusFilter && params.statusFilter !== "All") {
    query.set("statusFilter", params.statusFilter);
  }
  if (params.search?.trim()) query.set("search", params.search.trim());

  const response = await apiRequest<{ bookings: AdminBooking[]; pagination: PaginationMeta }>(
    `/api/admin/bookings?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.bookings,
    pagination: response.pagination,
  };
};

export const updateAdminBookingStatus = async (
  id: number,
  action: "issue" | "cancel" | "markpaid" | "markpending" | "markissued"
) => {
  const response = await apiRequest<{ message: string }>(`/api/admin/bookings/${id}/status`, {
    method: "PUT",
    auth: true,
    body: { action },
  });

  return response;
};

export const sendAdminDepartureReminder = async (id: number) => {
  const response = await apiRequest<{ message: string }>(`/api/admin/bookings/${id}/send-departure-reminder`, {
    method: "POST",
    auth: true,
  });

  return response;
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
export const holdFlightSeats = async (flightId: number, seatIds: number[]) => {
  return apiRequest<{ message: string }>(`/api/flights/${flightId}/seats/hold`, {
    method: "POST",
    auth: true,
    body: { seatIds },
  });
};

export const releaseFlightSeats = async (flightId: number, seatIds: number[]) => {
  return apiRequest<{ message: string }>(`/api/flights/${flightId}/seats/release`, {
    method: "POST",
    auth: true,
    body: { seatIds },
  });
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER";
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
  createdAt: string;
  bookingCount?: number;
  totalSpent?: number;
};

export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await apiRequest<{ users: AdminUser[] }>("/api/admin/users", {
    auth: true,
  });
  return response.users;
};

export const getAdminUsersPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: "ADMIN" | "USER";
  excludeRole?: "ADMIN" | "USER";
  includeStats?: boolean;
  sortBy?: "id" | "name" | "email" | "createdAt";
  sortDirection?: "asc" | "desc";
}): Promise<PaginatedResult<AdminUser>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.excludeRole) query.set("excludeRole", params.excludeRole);
  if (params.includeStats) query.set("includeStats", "true");
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<{ users: AdminUser[]; pagination: PaginationMeta }>(
    `/api/admin/users?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.users,
    pagination: response.pagination,
  };
};

export const blockAdminUser = async (userId: number): Promise<AdminUser> => {
  const response = await apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/block`, {
    method: "PUT",
    auth: true,
  });
  return response.user;
};

export const toggleAdminUserTwoFactor = async (userId: number): Promise<AdminUser> => {
  const response = await apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/2fa`, {
    method: "PUT",
    auth: true,
  });
  return response.user;
};

// ── Promo ────────────────────────────────────────────────────────────────────

export type Promo = {
  id: number;
  title: string;
  description: string | null;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  flightId: number | null;
  flight?: {
    id: number;
    flightNumber: string;
    origin: { city: string };
    destination: { city: string };
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PromoPayload = {
  title: string;
  description?: string;
  discount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  flightId?: number | null;
};

export const getActivePromos = async (): Promise<Promo[]> => {
  const { API_BASE_URL } = await import("@/lib/api-client");
  const res = await fetch(`${API_BASE_URL}/api/promos`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat promo.");
  const data = (await res.json()) as { promos: Promo[] };
  return data.promos;
};

export const getAdminPromos = async (): Promise<Promo[]> => {
  const response = await apiRequest<{ promos: Promo[] }>("/api/admin/promos", { auth: true });
  return response.promos;
};

export const getAdminPromosPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  statusFilter?: "All" | "Active" | "Inactive";
  sortBy?: "id" | "title" | "startDate" | "endDate" | "discount" | "createdAt";
  sortDirection?: "asc" | "desc";
}): Promise<PaginatedResult<Promo>> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.statusFilter && params.statusFilter !== "All") query.set("statusFilter", params.statusFilter);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<{ promos: Promo[]; pagination: PaginationMeta }>(
    `/api/admin/promos?${query.toString()}`,
    { auth: true },
  );

  return {
    data: response.promos,
    pagination: response.pagination,
  };
};

export const createAdminPromo = async (payload: PromoPayload): Promise<Promo> => {
  const response = await apiRequest<{ promo: Promo }>("/api/admin/promos", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return response.promo;
};

export const updateAdminPromo = async (id: number, payload: Partial<PromoPayload>): Promise<Promo> => {
  const response = await apiRequest<{ promo: Promo }>(`/api/admin/promos/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
  return response.promo;
};

export const deleteAdminPromo = async (id: number): Promise<void> => {
  await apiRequest(`/api/admin/promos/${id}`, { method: "DELETE", auth: true });
};