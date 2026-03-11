import '../models/seat_model.dart';
import 'api_client.dart';

class SeatService {
  static Future<List<Seat>> getFlightSeats(String flightId) async {
    final response = await ApiClient.get(
      '/api/flights/$flightId/seats',
      requireAuth: true,
    );
    final seats = (response['seats'] as List?) ?? [];
    return seats.map((s) => Seat.fromJson(s as Map<String, dynamic>)).toList();
  }

  static Future<void> holdSeats(String flightId, List<int> seatIds) async {
    await ApiClient.post(
      '/api/flights/$flightId/seats/hold',
      body: {'seatIds': seatIds},
      requireAuth: true,
    );
  }

  static Future<void> releaseSeats(String flightId, List<int> seatIds) async {
    await ApiClient.post(
      '/api/flights/$flightId/seats/release',
      body: {'seatIds': seatIds},
      requireAuth: true,
    );
  }
}
