import { apiRequest } from "@/lib/api-client";

export type BookingStatusApi = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

type BackendBooking = {
  id: number;
  bookingCode: string;
  status: BookingStatusApi;
  selectedSeats?: string | null;
  createdAt: string;
  flightId: number;
  totalPrice: number;
  flight: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    airline: {
      name: string;
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
  ticket: {
    id: number;
    pdfUrl: string | null;
  } | null;
};

type GetMyBookingsResponse = {
  bookings: BackendBooking[];
};

export const getMyBookingsFromApi = async () => {
  const response = await apiRequest<GetMyBookingsResponse>("/api/bookings", {
    auth: true,
  });

  return response.bookings;
};

export type PassengerPayload = {
  type: "ADULT" | "CHILD";
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
  };
};

export const createBookingFromApi = async (payload: {
  flightId: number;
  passengers: PassengerPayload[];
  seatIds?: number[];
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
      airline: { name: string };
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
