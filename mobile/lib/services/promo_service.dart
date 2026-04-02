import 'api_client.dart';

class PromoItem {
  final int id;
  final String title;
  final String? description;
  final int discount;
  final DateTime? endDate;
  final String? sourceLabel;
  final bool isFlightPromo;
  final String? flightId;
  final String? origin;
  final String? destination;

  PromoItem({
    required this.id,
    required this.title,
    required this.description,
    required this.discount,
    required this.endDate,
    required this.sourceLabel,
    required this.isFlightPromo,
    required this.flightId,
    required this.origin,
    required this.destination,
  });

  factory PromoItem.fromJson(Map<String, dynamic> json) {
    return PromoItem(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: (json['title'] as String?)?.trim().isNotEmpty == true
          ? json['title'] as String
          : 'Promo',
      description: json['description'] as String?,
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      endDate: DateTime.tryParse((json['endDate'] ?? '').toString()),
      sourceLabel: json['sourceLabel'] as String?,
      isFlightPromo: json['isFlightPromo'] == true,
      flightId: json['flightId']?.toString(),
      origin: json['origin']?.toString(),
      destination: json['destination']?.toString(),
    );
  }
}

class PromoService {
  static Future<List<PromoItem>> getActivePromos() async {
    final items = <PromoItem>[];
    final seen = <int>{};

    // 1) Global promos (promo untuk semua tiket)
    final response = await ApiClient.get('/api/promos');
    final promos = response['promos'] as List?;
    if (promos != null) {
      for (final p in promos) {
        final raw = Map<String, dynamic>.from(p as Map);
        final id = (raw['id'] as num?)?.toInt() ?? 0;
        if (id > 0 && seen.contains(id)) continue;
        if (id > 0) seen.add(id);
        items.add(
          PromoItem.fromJson({
            ...raw,
            'sourceLabel': 'Semua tiket',
            'isFlightPromo': false,
            'flightId': null,
            'origin': null,
            'destination': null,
          }),
        );
      }
    }

    // 2) Promo khusus flight (mengikuti konsep konten promo web)
    try {
      final flightsResponse = await ApiClient.get(
        '/api/flights/search?sortBy=departure-asc&limit=200',
      );
      final flights = flightsResponse['flights'] as List?;

      if (flights != null) {
        for (final f in flights) {
          final flight = Map<String, dynamic>.from(f as Map);
          final promosInFlight = flight['promos'] as List? ?? const [];
          final origin = ((flight['origin'] as Map?)?['city'] ?? '-').toString();
          final destination =
              ((flight['destination'] as Map?)?['city'] ?? '-').toString();
          final flightNo = (flight['flightNumber'] ?? '-').toString();

          for (final p in promosInFlight) {
            final raw = Map<String, dynamic>.from(p as Map);
            final id = (raw['id'] as num?)?.toInt() ?? 0;
            if (id > 0 && seen.contains(id)) continue;
            if (id > 0) seen.add(id);

            items.add(
              PromoItem.fromJson({
                ...raw,
                'sourceLabel': '$flightNo • $origin → $destination',
                'isFlightPromo': true,
                'flightId': flight['id']?.toString(),
                'origin': origin,
                'destination': destination,
              }),
            );
          }
        }
      }
    } catch (_) {
      // Tidak memblokir promo global jika fetch promo flight gagal.
    }

    return items;
  }
}
