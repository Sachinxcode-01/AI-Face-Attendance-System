import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'dart:math';
import 'package:provider/provider.dart';
import '../../core/session_manager.dart';
import '../../core/constants.dart';
import '../../services/api_service.dart';

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
            colorScheme: const ColorScheme.dark(
              primary: AppColors.gold,
              onPrimary: Colors.black,
              surface: AppColors.bgModal,
              onSurface: Colors.white,
            ),
            dialogTheme: const DialogThemeData(
              backgroundColor: AppColors.bgDark,
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
        _dobController.text = "$day/$month/$year";
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
            'setup_completed': true,
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
            'setup_completed': true,
          };

    // Sync to MongoDB
    if (_token.isNotEmpty) {
      await ApiService.updateProfile(profileData, _token);
      await ApiService.registerBiometric(_email, _token);
      final session = context.read<SessionManager>();
      await session.saveSession(
        token: _token,
        email: _email,
        role: _role,
        name: profileData['full_name']?.toString(),
        biometricRegistered: true,
      );
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
      backgroundColor: AppColors.bgDark,
      body: SafeArea(
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
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(25.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PROFILE SETUP',
                style: GoogleFonts.inter(
                  color: AppColors.gold,
                  letterSpacing: 2,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_currentPage + 1} / $_totalPages',
                style: const TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 15),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: (_currentPage + 1) / _totalPages,
              minHeight: 6,
              backgroundColor: Colors.white10,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
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
      padding: const EdgeInsets.symmetric(horizontal: 25),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(color: Colors.white54, fontSize: 16),
              ),
              const SizedBox(height: 40),
              ...children,
            ],
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
            height: 200,
            width: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.gold.withValues(alpha: 0.05),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
            ),
            child: const Icon(
              Icons.rocket_launch_outlined,
              size: 80,
              color: AppColors.gold,
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
        _buildInputField('Full Name', Icons.person_outline, _nameController),
        const SizedBox(height: 20),
        _buildInputField(
          'Phone Number',
          Icons.phone_android_outlined,
          _phoneController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Date of Birth',
          Icons.calendar_today_outlined,
          _dobController,
          onTap: () => _selectDate(context),
        ),
        const SizedBox(height: 20),
        _buildInputField('Gender', Icons.wc_outlined, _genderController),
        const SizedBox(height: 20),
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
            color: Colors.white38,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedLang = 'English'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: _selectedLang == 'English'
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _selectedLang == 'English'
                          ? AppColors.gold
                          : Colors.transparent,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'English',
                      style: GoogleFonts.inter(
                        color: _selectedLang == 'English'
                            ? Colors.black
                            : Colors.white70,
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
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: _selectedLang == 'Kannada'
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _selectedLang == 'Kannada'
                          ? AppColors.gold
                          : Colors.transparent,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'ಕನ್ನಡ (Kannada)',
                      style: GoogleFonts.inter(
                        color: _selectedLang == 'Kannada'
                            ? Colors.black
                            : Colors.white70,
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
        const SizedBox(height: 20),
        _buildInputField(
          'Designation',
          Icons.work_outline,
          _designationController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Subject Specialization',
          Icons.menu_book_outlined,
          _specializationController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Qualification',
          Icons.school_outlined,
          _qualificationController,
        ),
        const SizedBox(height: 20),
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
        const SizedBox(height: 20),
        _buildInputField(
          'Class / Course',
          Icons.school_outlined,
          _courseController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Section',
          Icons.grid_view_outlined,
          _sectionController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Roll Number',
          Icons.format_list_numbered_outlined,
          _rollNoController,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          'Parent / Guardian Details',
          Icons.family_restroom_outlined,
          _parentController,
        ),
      ],
    );
  }

  Widget _buildFaceRegistrationCard() {
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
                  // The AI Scan Ring
                  Container(
                        height: 220,
                        width: 220,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.gold.withValues(alpha: 0.5),
                            width: 2,
                          ),
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .rotate(duration: 3.seconds),

                  // The Camera Viewport
                  ClipOval(
                    child: Container(
                      height: 200,
                      width: 200,
                      color: Colors.black,
                      child: _isCameraInitialized
                          ? CameraPreview(_cameraController!)
                          : const Center(
                              child: CircularProgressIndicator(
                                color: AppColors.gold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                    'POSITION YOUR FACE IN THE CIRCLE',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: AppColors.gold,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .shimmer(duration: 2.seconds),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  final args =
                      ModalRoute.of(context)?.settings.arguments as Map?;
                  final email = args?['email'] ?? 'test@student.com';
                  final token = args?['token'] ?? '';

                  // Simulate Scanning
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Processing Biometric Signatures...'),
                      backgroundColor: AppColors.gold,
                      duration: Duration(seconds: 2),
                    ),
                  );

                  await Future.delayed(const Duration(milliseconds: 400));

                  final result = await ApiService.registerBiometric(
                    email,
                    token,
                  );

                  if (!mounted) return;
                  if (result.containsKey('message')) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'AI Scan Complete: Biometric ID Registered',
                        ),
                        backgroundColor: Colors.green,
                      ),
                    );
                    _nextPage();
                  }
                },
                icon: const Icon(Icons.face_unlock_outlined),
                label: const Text('START AI SCAN'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white10,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
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
            _buildThemeOption('Dark', Icons.dark_mode, true),
            const SizedBox(width: 20),
            _buildThemeOption('Light', Icons.light_mode, false),
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
        const Center(
          child: Icon(
            Icons.check_circle_outline,
            size: 120,
            color: Colors.greenAccent,
          ),
        ),
      ],
    );
  }

  Widget _buildInputField(
    String label,
    IconData icon,
    TextEditingController controller, {
    VoidCallback? onTap,
  }) {
    return TextField(
      controller: controller,
      readOnly: onTap != null,
      onTap: onTap,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white38),
        prefixIcon: Icon(icon, color: AppColors.gold),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
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
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.gold),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  sub,
                  style: const TextStyle(color: Colors.white38, fontSize: 10),
                ),
              ],
            ),
          ),
          Switch(
            value: active,
            onChanged: (v) {},
            activeThumbColor: AppColors.gold,
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
              ? AppColors.gold
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.black : Colors.white54,
              size: 40,
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.black : Colors.white70,
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
      padding: const EdgeInsets.all(25.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            TextButton(
              onPressed: () => _pageController.previousPage(
                duration: 400.ms,
                curve: Curves.easeOut,
              ),
              child: const Text(
                'BACK',
                style: TextStyle(color: Colors.white38),
              ),
            )
          else
            const SizedBox(width: 80),
          ElevatedButton(
            onPressed: _nextPage,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
            ),
            child: Text(
              _currentPage == _totalPages - 1 ? 'GET STARTED' : 'CONTINUE',
            ),
          ),
        ],
      ),
    );
  }
}
