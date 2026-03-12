import '../models/seat_model.dart';
import 'api_client.dart';

class SeatService {
  static Future<List<Seat>> getFlightSeats(String flightId) async {
    final response = await ApiClient.get(
      '/api/flights/$flightId/seats',
      requireAuth: true,
    );

    // Backend returns { seatMap: { ECONOMY: [...], BUSINESS: [...], FIRST: [...] } }
    // Flatten all classes into a single list
    final List<dynamic> raw;
    if (response.containsKey('seatMap')) {
      final seatMap = response['seatMap'] as Map<String, dynamic>;
      final tmp = <dynamic>[];
      for (final cls in ['FIRST', 'BUSINESS', 'ECONOMY']) {
        tmp.addAll((seatMap[cls] as List<dynamic>? ?? []));
      }
      raw = tmp;
    } else if (response.containsKey('seats')) {
      raw = (response['seats'] as List<dynamic>? ?? []);
    } else {
      return [];
    }

    // Each item is a FlightSeat with a nested `seat` object.
    // Merge nested fields so Seat.fromJson can read seatNumber / seatClass.
    return raw.map((item) {
      final fs = Map<String, dynamic>.from(item as Map);
      final nested = (fs['seat'] as Map<String, dynamic>?) ?? {};
      final merged = {
        ...fs,
        'seatNumber': fs['seatNumber'] ?? nested['seatNumber'],
        'seatClass': fs['seatClass'] ?? nested['seatClass'],
        'class': fs['class'] ?? nested['seatClass'],
      };
      return Seat.fromJson(merged);
    }).toList();
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
