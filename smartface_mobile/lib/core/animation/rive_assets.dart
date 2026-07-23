/// Asset registry for Rive interactive animations.
/// Maps verified state machines and artboard names to asset paths.
class RiveAssets {
  RiveAssets._();

  static const String faceScanRiv = 'assets/animations/rive/face_scan.riv';
  static const String qrScanRiv = 'assets/animations/rive/qr_scan.riv';
  static const String heroAttendanceRiv =
      'assets/animations/rive/hero_attendance.riv';
  static const String systemHealthRiv =
      'assets/animations/rive/system_health.riv';

  static const String faceScanStateMachine = 'FaceScanMachine';
  static const String qrScanStateMachine = 'QRScanMachine';
  static const String heroStateMachine = 'HeroMachine';
  static const String systemHealthStateMachine = 'HealthMachine';
}
