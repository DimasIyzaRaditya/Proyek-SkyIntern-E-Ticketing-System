import '../models/booking_model.dart';
import 'api_client.dart';

class BookingService {
  static Future<List<Booking>> getMyBookings() async {
    final response = await ApiClient.get(
      '/api/bookings',
      requireAuth: true,
    );

    final bookingsList = response['bookings'] as List?;
    if (bookingsList == null) return [];

    return bookingsList
        .map((e) => Booking.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Map<String, dynamic>> createBooking({
    required int flightId,
    required List<Map<String, dynamic>> passengers,
    List<int>? seatIds,
  }) async {
    return await ApiClient.post(
      '/api/bookings',
      body: {
        'flightId': flightId,
        'passengers': passengers,
        if (seatIds != null) 'seatIds': seatIds,
      },
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> createPayment(int bookingId) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/payment',
      body: {'bookingId': bookingId},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> cancelBooking(int bookingId) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/cancel',
      body: {},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> rescheduleBooking(
    int bookingId, {
    required int newFlightId,
  }) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/reschedule',
      body: {'newFlightId': newFlightId},
      requireAuth: true,
    );
  }
}
