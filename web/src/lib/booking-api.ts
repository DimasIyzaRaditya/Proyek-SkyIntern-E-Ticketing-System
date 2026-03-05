import { apiRequest } from "@/lib/api-client";

export type BookingStatusApi = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

type BackendBooking = {
  id: number;
  bookingCode: string;
  status: BookingStatusApi;
  createdAt: string;
  flight: {
    flightNumber: string;
    departureTime: string;
    airline: {
      name: string;
    };
    origin: {
      code?: string;
      city: string;
    };
    destination: {
      code?: string;
      city: string;
    };
  };
  passengers: Array<{
    firstName: string;
    lastName: string;
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
  idType: string;
  idNumber: string;
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
  snapToken?: string;
  redirectUrl?: string;
  payment?: {
    id: number;
    status: string;
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
