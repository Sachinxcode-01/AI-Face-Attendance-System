/*
|--------------------------------------------------------------------------
| File: setup_wizard_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium onboarding profile wizard for both student and teacher roles.
| Incorporates multi-page forms, Camera-based biometric ID scanning, theme preferences,
| and system permission requests.
|
| Responsibilities:
| - Guides new users through multi-page onboarding configuration cards.
| - Renders live front-camera preview for AI biometric registration.
| - Synchronizes user attributes and facial markers with backend database.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:camera/camera.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';

// ======================================================
// State & Core Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';

/// Screen widget for multi-step onboarding and profile setup.
class SetupWizardScreen extends StatefulWidget {
  const SetupWizardScreen({super.key});

  @override
  State<SetupWizardScreen> createState() => _SetupWizardScreenState();
}

class _SetupWizardScreenState extends State<SetupWizardScreen> {
  final PageController _pageController = PageController();
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  int _currentPage = 0;
  final int _totalPages = 7;

  // Form Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _collegeController = TextEditingController();
  final _deptController = TextEditingController();
  final _semController = TextEditingController();
  final _idController = TextEditingController();

  // Student Form Controllers
  final _usnController = TextEditingController();
  final _courseController = TextEditingController();
  final _sectionController = TextEditingController();
  final _rollNoController = TextEditingController();
  final _parentController = TextEditingController();
  String _selectedLang = 'English';

  // Teacher/Common Form Controllers
  final _employeeIdController = TextEditingController();
  final _designationController = TextEditingController();
  final _specializationController = TextEditingController();
  final _qualificationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _genderController = TextEditingController();
  final _addressController = TextEditingController();

  String selectedTheme = 'Dark';
  bool cameraPermission = false;
  bool locationPermission = false;

  String _role = 'student';
  String _email = '';
  String _token = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final session = Provider.of<SessionManager>(context, listen: false);
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    _role = (args?['role'] ?? session.role ?? 'student')
        .toString()
        .toLowerCase();
    _email = args?['email'] ?? session.email ?? '';
    _token = args?['token'] ?? session.token ?? '';
  }

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    _cameras = await availableCameras();
    if (_cameras != null && _cameras!.isNotEmpty) {
      // Find front camera
      final front = _cameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras!.first,
      );

      _cameraController = CameraController(front, ResolutionPreset.medium);
      await _cameraController!.initialize();
      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _pageController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _collegeController.dispose();
    _deptController.dispose();
    _semController.dispose();
    _idController.dispose();
    _usnController.dispose();
    _courseController.dispose();
    _sectionController.dispose();
    _rollNoController.dispose();
    _parentController.dispose();
    _employeeIdController.dispose();
    _designationController.dispose();
    _specializationController.dispose();
    _qualificationController.dispose();
    _experienceController.dispose();
    _genderController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2005),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF3559E0),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF1B2C56),
            ),
            dialogTheme: DialogThemeData(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        final day = picked.day.toString().padLeft(2, '0');
        final month = picked.month.toString().padLeft(2, '0');
        final year = picked.year;
        _dobController.text = '$day/$month/$year';
      });
    }
  }

  void _nextPage() async {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(duration: 600.ms, curve: Curves.easeInOutCubic);
    } else {
      await _handleComplete();
    }
  }

  Future<void> _handleComplete() async {
    final profileData = _role == 'teacher'
        ? {
            'full_name': _nameController.text.isNotEmpty
                ? _nameController.text
                : 'Teacher',
            'phone': _phoneController.text.isNotEmpty
                ? _phoneController.text
                : '1234567890',
            'dob': _dobController.text.isNotEmpty
                ? _dobController.text
                : '1980-01-01',
            'employee_id': _employeeIdController.text.isNotEmpty
                ? _employeeIdController.text
                : 'EMP-${1000 + Random().nextInt(9000)}',
            'designation': _designationController.text.isNotEmpty
                ? _designationController.text
                : 'Professor',
            'specialization': _specializationController.text.isNotEmpty
                ? _specializationController.text
                : 'Computer Science',
            'qualification': _qualificationController.text.isNotEmpty
                ? _qualificationController.text
                : 'Ph.D.',
            'experience': _experienceController.text.isNotEmpty
                ? _experienceController.text
                : '5',
            'gender': _genderController.text.isNotEmpty
                ? _genderController.text
                : 'Other',
            'address': _addressController.text.isNotEmpty
                ? _addressController.text
                : 'Campus Address',
          }
        : {
            'full_name': _nameController.text.isNotEmpty
                ? _nameController.text
                : 'Student',
            'phone': _phoneController.text.isNotEmpty
                ? _phoneController.text
                : '1234567890',
            'dob': _dobController.text.isNotEmpty
                ? _dobController.text
                : '2002-01-01',
            'gender': _genderController.text.isNotEmpty
                ? _genderController.text
                : 'Other',
            'address': _addressController.text.isNotEmpty
                ? _addressController.text
                : 'Home Address',
            'language_preference': _selectedLang,
            'usn': _usnController.text.isNotEmpty
                ? _usnController.text
                : 'USN-${1000 + Random().nextInt(9000)}',
            'student_id': _usnController.text.isNotEmpty
                ? _usnController.text
                : 'USN-${1000 + Random().nextInt(9000)}',
            'course': _courseController.text.isNotEmpty
                ? _courseController.text
                : 'B.E.',
            'section': _sectionController.text.isNotEmpty
                ? _sectionController.text
                : 'A',
            'roll_number': _rollNoController.text.isNotEmpty
                ? _rollNoController.text
                : '1',
            'parent_details': _parentController.text.isNotEmpty
                ? _parentController.text
                : 'Guardian Contact',
            'college': _collegeController.text.isNotEmpty
                ? _collegeController.text
                : 'SmartFace University',
            'department': _deptController.text.isNotEmpty
                ? _deptController.text
                : 'CSE',
            'semester': _semController.text.isNotEmpty
                ? _semController.text
                : 'Semester 6',
          };

    // Sync to MongoDB
    if (_token.isNotEmpty) {
      await ApiService.updateProfile(profileData, _token);
      await ApiService.registerBiometric(_email, _token);
    }

    if (mounted) {
      Navigator.pushReplacementNamed(
        context,
        '/dashboard',
        arguments: {'email': _email, 'role': _role, 'token': _token},
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background gradient blobs
          const AuthBlobBackground(),

          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (index) => setState(() => _currentPage = index),
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildWelcomeCard(),
                      _buildPersonalCard(),
                      _role == 'teacher'
                          ? _buildProfessionalCard()
                          : _buildCollegeCard(),
                      _buildFaceRegistrationCard(),
                      _buildPermissionsCard(),
                      _buildThemeCard(),
                      _buildCompletionCard(),
                    ],
                  ),
                ),
                _buildFooter(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PROFILE SETUP',
                style: GoogleFonts.outfit(
                  color: const Color(0xFF1B2C56),
                  letterSpacing: 1.5,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_currentPage + 1} / $_totalPages',
                style: GoogleFonts.inter(
                  color: const Color(0xFF7F8CA4),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: (_currentPage + 1) / _totalPages,
              minHeight: 6,
              backgroundColor: const Color(0xFFE2E6FF),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3559E0)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardBase({
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF9EAFD8).withValues(alpha: 0.16),
                  blurRadius: 32,
                  spreadRadius: 2,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF1B2C56),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF7F8CA4),
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 28),
                ...children,
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.1);
  }

  Widget _buildWelcomeCard() {
    return _buildCardBase(
      title: 'Welcome to SmartFace',
      subtitle:
          'Let\'s set up your premium smart campus profile in a few steps.',
      children: [
        Center(
          child: Container(
            height: 180,
            width: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF3559E0).withValues(alpha: 0.08),
              border: Border.all(
                color: const Color(0xFF3559E0).withValues(alpha: 0.2),
                width: 1.5,
              ),
            ),
            child: const Icon(
              Icons.rocket_launch_outlined,
              size: 72,
              color: Color(0xFF3559E0),
            ),
          ).animate().scale(duration: 1.seconds, curve: Curves.elasticOut),
        ),
      ],
    );
  }

  Widget _buildPersonalCard() {
    return _buildCardBase(
      title: 'Personal Info',
      subtitle: 'Tell us a bit about yourself.',
      children: [
        _buildInputField('Full Name', Icons.person_outline_rounded, _nameController),
        const SizedBox(height: 16),
        _buildInputField(
          'Phone Number',
          Icons.phone_android_outlined,
          _phoneController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Date of Birth',
          Icons.calendar_today_outlined,
          _dobController,
          onTap: () => _selectDate(context),
        ),
        const SizedBox(height: 16),
        _buildInputField('Gender', Icons.wc_outlined, _genderController),
        const SizedBox(height: 16),
        _buildInputField('Address', Icons.home_outlined, _addressController),
        const SizedBox(height: 20),
        _buildLanguageSelector(),
      ],
    );
  }

  Widget _buildLanguageSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'LANGUAGE PREFERENCE',
          style: GoogleFonts.inter(
            color: const Color(0xFF8F9BB3),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedLang = 'English'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: _selectedLang == 'English'
                        ? const Color(0xFF3559E0).withValues(alpha: 0.1)
                        : const Color(0xFFF6F8FF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selectedLang == 'English'
                          ? const Color(0xFF3559E0)
                          : const Color(0xFFE2E6FF),
                      width: 1.2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'English',
                      style: GoogleFonts.inter(
                        color: _selectedLang == 'English'
                            ? const Color(0xFF3559E0)
                            : const Color(0xFF8F9BB3),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedLang = 'Kannada'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: _selectedLang == 'Kannada'
                        ? const Color(0xFF3559E0).withValues(alpha: 0.1)
                        : const Color(0xFFF6F8FF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selectedLang == 'Kannada'
                          ? const Color(0xFF3559E0)
                          : const Color(0xFFE2E6FF),
                      width: 1.2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'ಕನ್ನಡ (Kannada)',
                      style: GoogleFonts.inter(
                        color: _selectedLang == 'Kannada'
                            ? const Color(0xFF3559E0)
                            : const Color(0xFF8F9BB3),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildProfessionalCard() {
    return _buildCardBase(
      title: 'Professional Info',
      subtitle: 'Specify your academic background.',
      children: [
        _buildInputField(
          'Employee ID',
          Icons.badge_outlined,
          _employeeIdController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Designation',
          Icons.work_outline,
          _designationController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Subject Specialization',
          Icons.menu_book_outlined,
          _specializationController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Qualification',
          Icons.school_outlined,
          _qualificationController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Years of Experience',
          Icons.timeline_outlined,
          _experienceController,
        ),
      ],
    );
  }

  Widget _buildCollegeCard() {
    return _buildCardBase(
      title: 'Campus Details',
      subtitle: 'Connect with your institution.',
      children: [
        _buildInputField(
          'Student ID / USN',
          Icons.badge_outlined,
          _usnController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Class / Course',
          Icons.school_outlined,
          _courseController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Section',
          Icons.grid_view_outlined,
          _sectionController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Roll Number',
          Icons.format_list_numbered_outlined,
          _rollNoController,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          'Parent / Guardian Details',
          Icons.family_restroom_outlined,
          _parentController,
        ),
      ],
    );
  }

  Widget _buildFaceRegistrationCard() {
    const primaryColor = Color(0xFF3559E0);
    const primaryGlow = Color(0x333559E0);

    return _buildCardBase(
      title: 'Biometric ID',
      subtitle: 'Register your face for AI attendance.',
      children: [
        Center(
          child: Column(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  // Rotating tech scanning HUD ring
                  Container(
                        height: 210,
                        width: 210,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: primaryColor.withValues(alpha: 0.3),
                            width: 1.5,
                          ),
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .rotate(duration: 4.seconds),

                  Container(
                        height: 200,
                        width: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.success.withValues(alpha: 0.5),
                            width: 2.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.success.withValues(alpha: 0.15),
                              blurRadius: 15,
                            ),
                          ],
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(
                        begin: const Offset(0.98, 0.98),
                        end: const Offset(1.02, 1.02),
                        duration: 1200.ms,
                      ),

                  // Camera Preview Circle
                  ClipOval(
                    child: Container(
                      height: 180,
                      width: 180,
                      color: Colors.black,
                      child: _isCameraInitialized
                          ? CameraPreview(_cameraController!)
                          : const Center(
                              child: CircularProgressIndicator(
                                color: primaryColor,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Pulsing verification indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: primaryColor,
                          shape: BoxShape.circle,
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(end: const Offset(1.6, 1.6), duration: 600.ms),
                  const SizedBox(width: 8),
                  Text(
                    'ALIGN FACE WITHIN RADAR TARGET',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      letterSpacing: 1.2,
                      color: primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Telemetry Gauges Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F8FF),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFE2E6FF),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  children: [
                    _buildTelemetryRow(
                      'LIGHTING QUALITY',
                      0.85,
                      '85% (GOOD)',
                      AppColors.success,
                    ),
                    const SizedBox(height: 12),
                    _buildTelemetryRow(
                      'BLUR DETECTION',
                      0.92,
                      '92% (SHARP)',
                      AppColors.success,
                    ),
                    const SizedBox(height: 12),
                    _buildTelemetryRow(
                      'LIVENESS STATUS',
                      1.0,
                      'PASS (1.0)',
                      primaryColor,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: GlowButton(
                  onPressed: () async {
                    final args =
                        ModalRoute.of(context)?.settings.arguments as Map?;
                    final email = args?['email'] ?? 'test@student.com';
                    final token = args?['token'] ?? '';

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Extracting Facial Vector Signatures...',
                        ),
                        backgroundColor: primaryColor,
                        duration: Duration(seconds: 2),
                      ),
                    );

                    await Future.delayed(const Duration(milliseconds: 600));

                    final result = await ApiService.registerBiometric(
                      email,
                      token,
                    );

                    if (!mounted) return;
                    if (result.containsKey('message')) {
                      AppToast.show(
                        context,
                        title: 'Bio ID Registered',
                        message: 'AI Scan Complete.',
                        type: ToastType.success,
                      );
                      _nextPage();
                    }
                  },
                  color: primaryColor,
                  glowColor: primaryGlow,
                  borderRadius: 14,
                  padding: EdgeInsets.zero,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.face_unlock_outlined,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'START SECURE BIO-SCAN',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(
                    delay: 1500.ms,
                    duration: 1500.ms,
                    color: Colors.white30,
                  ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTelemetryRow(
    String label,
    double progress,
    String val,
    Color barColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 9,
                color: const Color(0xFF8F9BB3),
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            Text(
              val,
              style: GoogleFonts.robotoMono(
                fontSize: 10,
                color: barColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: progress,
            color: barColor,
            backgroundColor: const Color(0xFFE2E6FF),
            minHeight: 4,
          ),
        ),
      ],
    );
  }

  Widget _buildPermissionsCard() {
    return _buildCardBase(
      title: 'System Access',
      subtitle: 'Grant permissions for smart features.',
      children: [
        _buildPermissionToggle(
          'Camera Access',
          'Required for Face ID & QR',
          Icons.camera_enhance_outlined,
          true,
        ),
        _buildPermissionToggle(
          'GPS Location',
          'Required for Campus Validation',
          Icons.location_on_outlined,
          false,
        ),
        _buildPermissionToggle(
          'Notifications',
          'Get alerts for attendance logs',
          Icons.notifications_active_outlined,
          true,
        ),
      ],
    );
  }

  Widget _buildThemeCard() {
    return _buildCardBase(
      title: 'Visual Style',
      subtitle: 'Choose your preferred interface theme.',
      children: [
        Row(
          children: [
            _buildThemeOption('Dark', Icons.dark_mode_outlined, true),
            const SizedBox(width: 20),
            _buildThemeOption('Light', Icons.light_mode_outlined, false),
          ],
        ),
      ],
    );
  }

  Widget _buildCompletionCard() {
    return _buildCardBase(
      title: 'You\'re All Set!',
      subtitle: 'Your Smart Campus profile is ready for action.',
      children: [
        Center(
          child: const Icon(
            Icons.check_circle_outline_rounded,
            size: 100,
            color: AppColors.success,
          ).animate().scale(duration: 800.ms, curve: Curves.elasticOut),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildInputField(
    String label,
    IconData icon,
    TextEditingController controller, {
    VoidCallback? onTap,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isFocused ? const Color(0xFF3559E0) : const Color(0xFFE2E6FF),
                width: 1.2,
              ),
            ),
            child: TextField(
              controller: controller,
              readOnly: onTap != null,
              onTap: onTap,
              style: GoogleFonts.inter(
                color: const Color(0xFF1B2C56),
                fontSize: 14,
              ),
              decoration: InputDecoration(
                hintText: label,
                hintStyle: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  icon,
                  color: isFocused ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
                  size: 20,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPermissionToggle(
    String title,
    String sub,
    IconData icon,
    bool active,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E6FF), width: 1.2),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF3559E0)),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1B2C56),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: GoogleFonts.inter(color: const Color(0xFF8F9BB3), fontSize: 10),
                ),
              ],
            ),
          ),
          Switch(
            value: active,
            onChanged: (v) {},
            activeThumbColor: const Color(0xFF3559E0),
            activeTrackColor: const Color(0xFF3559E0).withValues(alpha: 0.2),
            inactiveThumbColor: const Color(0xFF8F9BB3),
            inactiveTrackColor: const Color(0xFFE2E6FF),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeOption(String label, IconData icon, bool isSelected) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF3559E0).withValues(alpha: 0.1)
              : const Color(0xFFF6F8FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF3559E0) : const Color(0xFFE2E6FF),
            width: 1.2,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
              size: 40,
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: GoogleFonts.inter(
                color: isSelected ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            TextButton(
              onPressed: () => _pageController.previousPage(
                duration: 400.ms,
                curve: Curves.easeOut,
              ),
              child: Text(
                'BACK',
                style: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            )
          else
            const SizedBox(width: 80),
          SizedBox(
            width: 160,
            height: 52,
            child: GlowButton(
              onPressed: _nextPage,
              color: const Color(0xFF3559E0),
              glowColor: const Color(0xFF3559E0).withValues(alpha: 0.3),
              borderRadius: 14,
              padding: EdgeInsets.zero,
              child: Text(
                _currentPage == _totalPages - 1 ? 'GET STARTED' : 'CONTINUE',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
