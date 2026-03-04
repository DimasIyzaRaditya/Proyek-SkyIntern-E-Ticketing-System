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
