class FlightCardItem {
  final String id;
  final String flightNumber;
  final String airline;
  final String logo;
  final String aircraft;
  final String origin;
  final String destination;
  final String departureTime;
  final String arrivalTime;
  final String duration;
  final int price;
  final List<String> facilities;

  FlightCardItem({
    required this.id,
    required this.flightNumber,
    required this.airline,
    required this.logo,
    required this.aircraft,
    required this.origin,
    required this.destination,
    required this.departureTime,
    required this.arrivalTime,
    required this.duration,
    required this.price,
    required this.facilities,
  });

  factory FlightCardItem.fromJson(Map<String, dynamic> json) {
    final flight = json['flight'] ?? json;
    
    final origin = flight['origin'] ?? {};
    final destination = flight['destination'] ?? {};
    
    String formatTime(String? value) {
      if (value == null) return '--:--';
      try {
        final dt = DateTime.parse(value);
        return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (e) {
        return value;
      }
    }

    String formatDuration(dynamic value) {
      if (value is int) {
        final hours = value ~/ 60;
        final mins = value % 60;
        return '${hours}h ${mins}m';
      }
      return value?.toString() ?? '0h';
    }

    List<String> parseFacilities(dynamic value) {
      if (value == null) return ['Cabin Bag 7kg'];
      if (value is String) {
        return value.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
      if (value is List) {
        return value.map((e) => e.toString()).toList();
      }
      return ['Cabin Bag 7kg'];
    }

    return FlightCardItem(
      id: (json['id'] ?? flight['id']).toString(),
      flightNumber: flight['flightNumber'] ?? '',
      airline: (flight['airline']?['name'] ?? 'Unknown Airline').toString(),
      logo: (flight['airline']?['logo'] ?? '✈️').toString(),
      aircraft: (flight['aircraft'] ?? 'Aircraft').toString(),
      origin: '${origin['city'] ?? ''} (${origin['code'] ?? 'XXX'})',
      destination: '${destination['city'] ?? ''} (${destination['code'] ?? 'XXX'})',
      departureTime: formatTime(flight['departureTime'] as String?),
      arrivalTime: formatTime(flight['arrivalTime'] as String?),
      duration: formatDuration(flight['duration']),
      price: (flight['basePrice'] as num?)?.toInt() ?? 0,
      facilities: parseFacilities(flight['facilities']),
    );
  }
}

class Airport {
  final int id;
  final String code;
  final String city;
  final String country;
  final String airportName;
  final String label;

  Airport({
    required this.id,
    required this.code,
    required this.city,
    required this.country,
    required this.airportName,
    required this.label,
  });

  factory Airport.fromJson(Map<String, dynamic> json) {
    return Airport(
      id: json['id'] as int,
      code: json['code'] ?? '',
      city: json['city'] ?? '',
      country: json['country'] ?? '',
      airportName: json['airportName'] ?? '',
      label: json['label'] ?? '',
    );
  }
}
