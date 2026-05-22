import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'dart:math';
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
  String selectedTheme = 'Dark';
  bool cameraPermission = false;
  bool locationPermission = false;

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
  @override
  void dispose() {
    _cameraController?.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() async {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(duration: 600.ms, curve: Curves.easeInOutCubic);
    } else {
      await _handleComplete();
    }
  }

  Future<void> _handleComplete() async {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final email = args?['email'] ?? 'test@student.com';
    final role = args?['role'] ?? 'student';
    final token = args?['token'] ?? '';
    
    final profileData = {
      'full_name': _nameController.text.isNotEmpty ? _nameController.text : 'User',
      'phone': _phoneController.text.isNotEmpty ? _phoneController.text : '1234567890',
      'dob': _dobController.text.isNotEmpty ? _dobController.text : '2002-01-01',
      'college': _collegeController.text.isNotEmpty ? _collegeController.text : 'SmartFace University',
      'department': _deptController.text.isNotEmpty ? _deptController.text : 'CSE',
      'semester': _semController.text.isNotEmpty ? _semController.text : 'Semester 6',
      'student_id': _idController.text.isNotEmpty ? _idController.text : 'SF-${DateTime.now().year}-${1000 + Random().nextInt(9000)}',
    };

    // Sync to MongoDB
    if (token.isNotEmpty) {
      await ApiService.updateProfile(profileData, token);
      await ApiService.registerBiometric(email, token);
    }
    
    if (mounted) {
      Navigator.pushReplacementNamed(
        context, 
        '/dashboard',
        arguments: {'email': email, 'role': role, 'token': token},
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
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
                  _buildCollegeCard(),
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
                style: GoogleFonts.outfit(color: const Color(0xFFFFD700), letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold),
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
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFFD700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardBase({required String title, required String subtitle, required List<Widget> children}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
          Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 16)),
          const SizedBox(height: 40),
          ...children,
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.1);
  }

  Widget _buildWelcomeCard() {
    return _buildCardBase(
      title: 'Welcome to SmartFace',
      subtitle: 'Let\'s set up your premium smart campus profile in a few steps.',
      children: [
        Center(
          child: Container(
            height: 200,
            width: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFFFD700).withValues(alpha: 0.05),
              border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.2)),
            ),
            child: const Icon(Icons.rocket_launch_outlined, size: 80, color: Color(0xFFFFD700)),
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
        _buildInputField('Phone Number', Icons.phone_android_outlined, _phoneController),
        const SizedBox(height: 20),
        _buildInputField('Date of Birth', Icons.calendar_today_outlined, _dobController),
      ],
    );
  }

  Widget _buildCollegeCard() {
    return _buildCardBase(
      title: 'Campus Details',
      subtitle: 'Connect with your institution.',
      children: [
        _buildInputField('Search College', Icons.search, _collegeController),
        const SizedBox(height: 20),
        _buildInputField('Department', Icons.account_tree_outlined, _deptController),
        const SizedBox(height: 20),
        _buildInputField('Current Year/Sem', Icons.school_outlined, _semController),
        const SizedBox(height: 20),
        _buildInputField('Student ID', Icons.badge_outlined, _idController),
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
                      border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.5), width: 2),
                    ),
                  ).animate(onPlay: (c) => c.repeat()).rotate(duration: 3.seconds),
                  
                  // The Camera Viewport
                  ClipOval(
                    child: Container(
                      height: 200,
                      width: 200,
                      color: Colors.black,
                      child: _isCameraInitialized
                          ? CameraPreview(_cameraController!)
                          : const Center(child: CircularProgressIndicator(color: Color(0xFFFFD700))),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                'POSITION YOUR FACE IN THE CIRCLE',
                style: GoogleFonts.outfit(fontSize: 10, letterSpacing: 2, color: const Color(0xFFFFD700), fontWeight: FontWeight.bold),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 2.seconds),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  final args = ModalRoute.of(context)?.settings.arguments as Map?;
                  final email = args?['email'] ?? 'test@student.com';
                  final token = args?['token'] ?? '';
                  
                  // Simulate Scanning
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Processing Biometric Signatures...'), backgroundColor: Color(0xFFFFD700), duration: Duration(seconds: 2)),
                  );
                  
                  await Future.delayed(const Duration(seconds: 2));
                  
                  final result = await ApiService.registerBiometric(email, token);
                  
                  if (!mounted) return;
                  if (result.containsKey('message')) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('AI Scan Complete: Biometric ID Registered'), backgroundColor: Colors.green),
                    );
                    _nextPage();
                  }
                },
                icon: const Icon(Icons.face_unlock_outlined),
                label: const Text('START AI SCAN'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white10, foregroundColor: Colors.white),
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
        _buildPermissionToggle('Camera Access', 'Required for Face ID & QR', Icons.camera_enhance_outlined, true),
        _buildPermissionToggle('GPS Location', 'Required for Campus Validation', Icons.location_on_outlined, false),
        _buildPermissionToggle('Notifications', 'Get alerts for attendance logs', Icons.notifications_active_outlined, true),
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
          child: Icon(Icons.check_circle_outline, size: 120, color: Colors.greenAccent),
        ),
      ],
    );
  }

  Widget _buildInputField(String label, IconData icon, TextEditingController controller) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white38),
        prefixIcon: Icon(icon, color: const Color(0xFFFFD700)),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
      ),
    );
  }

  Widget _buildPermissionToggle(String title, String sub, IconData icon, bool active) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(20)),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFFFD700)),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(sub, style: const TextStyle(color: Colors.white38, fontSize: 10)),
              ],
            ),
          ),
          Switch(value: active, onChanged: (v) {}, activeThumbColor: const Color(0xFFFFD700)),
        ],
      ),
    );
  }

  Widget _buildThemeOption(String label, IconData icon, bool isSelected) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFD700) : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? Colors.black : Colors.white54, size: 40),
            const SizedBox(height: 10),
            Text(label, style: TextStyle(color: isSelected ? Colors.black : Colors.white70, fontWeight: FontWeight.bold)),
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
              onPressed: () => _pageController.previousPage(duration: 400.ms, curve: Curves.easeOut),
              child: const Text('BACK', style: TextStyle(color: Colors.white38)),
            )
          else
            const SizedBox(width: 80),
          ElevatedButton(
            onPressed: _nextPage,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              backgroundColor: const Color(0xFFFFD700),
              foregroundColor: Colors.black,
            ),
            child: Text(_currentPage == _totalPages - 1 ? 'GET STARTED' : 'CONTINUE'),
          ),
        ],
      ),
    );
  }
}
