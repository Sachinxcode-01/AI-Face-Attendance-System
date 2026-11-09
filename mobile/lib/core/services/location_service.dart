import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class GeofenceValidationResult {
  final bool isWithin;
  final double distanceMeters;
  final double maxAllowedMeters;
  final String? reason;
  final double? latitude;
  final double? longitude;

  const GeofenceValidationResult({
    required this.isWithin,
    required this.distanceMeters,
    required this.maxAllowedMeters,
    this.reason,
    this.latitude,
    this.longitude,
  });
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  /// Default campus / classroom fallback coordinates
  static const double defaultCampusLat = 12.9716;
  static const double defaultCampusLng = 77.5946;
  static const double defaultGeofenceRadius = 150.0; // 150 meters

  /// Checks if location services are enabled and permissions granted.
  Future<bool> checkPermission() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('[LocationService] Location services disabled.');
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('[LocationService] Location permissions denied.');
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint(
          '[LocationService] Location permissions permanently denied.',
        );
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('[LocationService] checkPermission error: $e');
      return false;
    }
  }

  /// Obtains current GPS coordinates.
  Future<Position?> getCurrentPosition() async {
    try {
      final hasPerm = await checkPermission();
      if (!hasPerm) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
    } catch (e) {
      debugPrint('[LocationService] getCurrentPosition error: $e');
      return null;
    }
  }

  /// Calculates geodesic distance in meters between two lat/lng pairs.
  double calculateDistance({
    required double startLatitude,
    required double startLongitude,
    required double endLatitude,
    required double endLongitude,
  }) {
    return Geolocator.distanceBetween(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    );
  }

  /// Validates whether the student's current position is within the classroom boundary.
  Future<GeofenceValidationResult> validateClassroomGeofence({
    double? targetLatitude,
    double? targetLongitude,
    double? maxRadiusMeters,
  }) async {
    final targetLat = targetLatitude ?? defaultCampusLat;
    final targetLng = targetLongitude ?? defaultCampusLng;
    final maxRadius = maxRadiusMeters ?? defaultGeofenceRadius;

    final position = await getCurrentPosition();
    if (position == null) {
      return GeofenceValidationResult(
        isWithin: false,
        distanceMeters: -1,
        maxAllowedMeters: maxRadius,
        reason:
            'GPS unavailable or permission denied. Please enable device location.',
      );
    }

    final distance = calculateDistance(
      startLatitude: position.latitude,
      startLongitude: position.longitude,
      endLatitude: targetLat,
      endLongitude: targetLng,
    );

    if (distance > maxRadius) {
      return GeofenceValidationResult(
        isWithin: false,
        distanceMeters: distance,
        maxAllowedMeters: maxRadius,
        latitude: position.latitude,
        longitude: position.longitude,
        reason:
            'Outside classroom boundary (${distance.round()}m away, max allowed: ${maxRadius.round()}m).',
      );
    }

    return GeofenceValidationResult(
      isWithin: true,
      distanceMeters: distance,
      maxAllowedMeters: maxRadius,
      latitude: position.latitude,
      longitude: position.longitude,
    );
  }
}
