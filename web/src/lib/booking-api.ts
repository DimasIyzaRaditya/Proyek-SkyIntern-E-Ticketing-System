import { apiRequest } from "@/lib/api-client";

export type BookingStatusApi = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

type BackendBooking = {
  id: number;
  bookingCode: string;
  status: BookingStatusApi;
  expiresAt?: string | null;
  selectedSeats?: string | null;
  createdAt: string;
  flightId: number;
  totalPrice: number;
  flight: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    basePrice?: number;
    tax?: number;
    adminFee?: number;
    airline: {
      name: string;
      logo?: string | null;
    };
    origin: {
      code?: string;
      name: string;
      city: string;
    };
    destination: {
      code?: string;
      name: string;
      city: string;
    };
  };
  passengers: Array<{
    firstName: string;
    lastName: string;
    title?: string;
    documentType?: string;
    documentNumber?: string;
    nationality?: string;
    dateOfBirth?: string | null;
    type?: string;
  }>;
  flightSeats?: Array<{
    additionalPrice?: number;
    seat?: {
      seatNumber?: string;
    };
  }>;
  ticket: {
    id: number;
    pdfUrl: string | null;
  } | null;
};

type GetMyBookingsResponse = {
  bookings: BackendBooking[];
};

type PaginatedMyBookingsResponse = {
  bookings: BackendBooking[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export const getMyBookingsFromApi = async () => {
  const response = await apiRequest<GetMyBookingsResponse>("/api/bookings", {
    auth: true,
  });

  return response.bookings;
};

export const getMyBookingsPageFromApi = async (params: {
  page: number;
  limit: number;
  status?: BookingStatusApi;
  statusFilter?: "All" | "Pending" | "Paid" | "Issued" | "Cancelled";
  sortDirection?: "asc" | "desc";
}) => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) query.set("status", params.status);
  if (params.statusFilter && params.statusFilter !== "All") query.set("statusFilter", params.statusFilter);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const response = await apiRequest<PaginatedMyBookingsResponse>(`/api/bookings?${query.toString()}`, {
    auth: true,
  });

  return response;
};

export type PassengerPayload = {
  type: "ADULT" | "CHILD" | "INFANT";
  title: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth?: string;
};

type CreateBookingResponse = {
  message: string;
  booking: {
    id: number;
    bookingCode: string;
    status: BookingStatusApi;
    totalPrice: number;
    expiresAt?: string | null;
  };
};

export const createBookingFromApi = async (payload: {
  flightId: number;
  passengers: PassengerPayload[];
  seatIds?: number[];
  promoId?: number;
}) => {
  return apiRequest<CreateBookingResponse>("/api/bookings", {
    method: "POST",
    auth: true,
    body: payload,
  });
};

type CreatePaymentResponse = {
  message: string;
  payment: {
    orderId: string;
    amount: number;
    snapToken: string;
    redirectUrl: string;
  };
};

export const createPaymentFromApi = async (bookingId: number) => {
  return apiRequest<CreatePaymentResponse>(`/api/bookings/${bookingId}/payment`, {
    method: "POST",
    auth: true,
    body: { bookingId },
  });
};

export const cancelBookingFromApi = async (bookingId: number) => {
  return apiRequest<{ message: string }>(`/api/bookings/${bookingId}/cancel`, {
    method: "POST",
    auth: true,
  });
};

export const syncPaymentFromApi = async (bookingId: number) => {
  return apiRequest<{ message: string; status: string }>(`/api/bookings/${bookingId}/sync-payment`, {
    method: "POST",
    auth: true,
  });
};

export const getBookingDetailFromApi = async (bookingId: number) => {
  return apiRequest<{ booking: BackendBooking & { expiresAt?: string | null } }>(`/api/bookings/${bookingId}`, {
    auth: true,
  });
};

export type VerifyBookingResult = {
  booking: {
    id: number;
    bookingCode: string;
    status: string;
    selectedSeats: string | null;
    flight: {
      flightNumber: string;
      departureTime: string;
      arrivalTime: string;
      airline: { name: string; logo?: string | null };
      origin: { city: string; country: string };
      destination: { city: string; country: string };
    };
    passengers: Array<{
      title?: string;
      firstName: string;
      lastName: string;
      type?: string;
    }>;
  };
};

export const verifyBookingFromApi = async (code: string) => {
  return apiRequest<VerifyBookingResult>(`/api/bookings/verify?code=${encodeURIComponent(code)}`);
};
