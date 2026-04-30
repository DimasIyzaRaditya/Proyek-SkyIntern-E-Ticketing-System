import '../models/flight_model.dart';
import 'api_client.dart';
import '../models/pagination_model.dart';

class FlightService {
  static Future<List<Airport>> getAirports() async {
    final response = await ApiClient.get('/api/flights/airports');
    
    final airportsList = response['airports'] as List?;
    if (airportsList == null) return [];

    return airportsList
        .map((e) => Airport.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<PaginatedResult<FlightCardItem>> searchFlights({
    required String originId,
    required String destinationId,
    required String departureDate,
    String? returnDate,
    String adult = '1',
    String child = '0',
    String? sortBy,
    int page = 1,
    int limit = 20,
  }) async {
    final buffer = StringBuffer('/api/flights/search?');
    buffer.write('originId=$originId&');
    buffer.write('destinationId=$destinationId&');
    buffer.write('departureDate=$departureDate&');
    if (returnDate != null) buffer.write('returnDate=$returnDate&');
    buffer.write('adult=$adult&');
    buffer.write('child=$child');
    if (sortBy != null) buffer.write('&sortBy=$sortBy');
    buffer.write('&page=$page&limit=$limit');

    try {
      final response = await ApiClient.get(buffer.toString());
      
      final flightsList = response['flights'] as List?;
      final items = (flightsList ?? [])
          .map((e) => FlightCardItem.fromJson(e as Map<String, dynamic>))
          .toList();
      final pagination = response['pagination'] is Map
          ? PaginationMeta.fromJson(
              Map<String, dynamic>.from(response['pagination'] as Map),
            )
          : null;

      return PaginatedResult(items: items, pagination: pagination);
    } catch (e) {
      rethrow;
    }
  }

  static Future<FlightCardItem> getFlightDetail(String flightId) async {
    final response = await ApiClient.get('/api/flights/$flightId');

    final flightJson = response['flight'] as Map<String, dynamic>?;
    if (flightJson == null) throw Exception('Flight not found');

    return FlightCardItem.fromJson(flightJson);
  }
}
