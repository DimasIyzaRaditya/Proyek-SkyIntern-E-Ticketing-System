import '../models/flight_model.dart';
import 'api_client.dart';

class FlightService {
  static Future<List<Airport>> getAirports() async {
    final response = await ApiClient.get('/api/flights/airports');
    
    final airportsList = response['airports'] as List?;
    if (airportsList == null) return [];

    return airportsList
        .map((e) => Airport.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<FlightCardItem>> searchFlights({
    required String originId,
    required String destinationId,
    required String departureDate,
    String? returnDate,
    String adult = '1',
    String child = '0',
    String? sortBy,
  }) async {
    final buffer = StringBuffer('/api/flights/search?');
    buffer.write('originId=$originId&');
    buffer.write('destinationId=$destinationId&');
    buffer.write('departureDate=$departureDate&');
    if (returnDate != null) buffer.write('returnDate=$returnDate&');
    buffer.write('adult=$adult&');
    buffer.write('child=$child');
    if (sortBy != null) buffer.write('&sortBy=$sortBy');

    try {
      final response = await ApiClient.get(buffer.toString());
      
      final flightsList = response['flights'] as List?;
      if (flightsList == null) return [];

      return flightsList
          .map((e) => FlightCardItem.fromJson(e as Map<String, dynamic>))
          .toList();
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
