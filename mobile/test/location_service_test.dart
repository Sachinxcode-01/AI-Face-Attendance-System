import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/core/services/location_service.dart';

void main() {
  group('LocationService Geofence Tests', () {
    late LocationService service;

    setUp(() {
      service = LocationService();
    });

    test('Singleton identity test', () {
      final s1 = LocationService();
      final s2 = LocationService();
      expect(identical(s1, s2), isTrue);
    });

    test('Geodesic distance calculation is accurate for known coordinates', () {
      // Distance between Bangalore (12.9716, 77.5946) and nearby classroom (~110m away)
      const lat1 = 12.9716;
      const lng1 = 77.5946;
      const lat2 = 12.9725;
      const lng2 = 77.5950;

      final distance = service.calculateDistance(
        startLatitude: lat1,
        startLongitude: lng1,
        endLatitude: lat2,
        endLongitude: lng2,
      );

      expect(distance, greaterThan(80));
      expect(distance, lessThan(150));
    });

    test('Zero distance for identical coordinates', () {
      final distance = service.calculateDistance(
        startLatitude: 12.9716,
        startLongitude: 77.5946,
        endLatitude: 12.9716,
        endLongitude: 77.5946,
      );
      expect(distance, equals(0.0));
    });
  });
}

