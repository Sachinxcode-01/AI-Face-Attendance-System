/*
|--------------------------------------------------------------------------
| File: setup_wizard_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace Attendance
|
| Purpose:
| Renders the onboarding profile wizard for both student and teacher roles.
| Incorporates multi-page forms, biometric ID registration, styled under
| the global auth design system.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:provider/provider.dart
| - package:smartface_attendance/features/auth/controllers/session_manager.dart
| - package:smartface_attendance/core/network/api_service.dart
| - package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart
|--------------------------------------------------------------------------
*/

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart'
    hide PrimaryButton;

class SetupWizardScreen extends StatefulWidget {
  const SetupWizardScreen({super.key});

  @override
  State<SetupWizardScreen> createState() => _SetupWizardScreenState();
}

class _SetupWizardScreenState extends State<SetupWizardScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  int get _totalPages {
    if (_role == 'teacher' || _role == 'faculty' || _role == 'lecturer') {
      return 5;
    }
    if (_role == 'admin') {
      return 3;
    }
    if (_role == 'parent') {
      return 3;
    }
    return 5; // student
  }

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _deptController = TextEditingController();
  final _semController = TextEditingController();
  final _usnController = TextEditingController();
  final _courseController = TextEditingController();
  final _sectionController = TextEditingController();
  final _rollNoController = TextEditingController();
  final _parentController = TextEditingController();
  final _collegeController = TextEditingController();
  final _employeeIdController = TextEditingController();
  final _designationController = TextEditingController();
  final _specializationController = TextEditingController();
  final _qualificationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _genderController = TextEditingController();
  final _addressController = TextEditingController();

  final String _selectedLang = 'English';
  bool _isScanLoading = false;
  bool _scanComplete = false;

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
  void dispose() {
    _pageController.dispose();
    for (final c in [
      _nameController,
      _phoneController,
      _dobController,
      _deptController,
      _semController,
      _usnController,
      _courseController,
      _sectionController,
      _rollNoController,
      _parentController,
      _collegeController,
      _employeeIdController,
      _designationController,
      _specializationController,
      _qualificationController,
      _experienceController,
      _genderController,
      _addressController,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2005),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AuthDesign.primaryIndigo,
            onPrimary: Colors.white,
            surface: Colors.white,
            onSurface: AuthDesign.textHeading,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null && mounted) {
      final d = picked.day.toString().padLeft(2, '0');
      final m = picked.month.toString().padLeft(2, '0');
      setState(() => _dobController.text = '$d/$m/${picked.year}');
    }
  }

  bool _validateCurrentStep() {
    if (_currentPage == 0) return true;
    if (_currentPage == 1) {
      if (_nameController.text.trim().isEmpty) {
        AppToast.show(
          context,
          message: 'Please enter your Full Name',
          type: ToastType.warning,
        );
        return false;
      }
      if (_phoneController.text.trim().isEmpty) {
        AppToast.show(
          context,
          message: 'Please enter your Phone Number',
          type: ToastType.warning,
        );
        return false;
      }
      return true;
    }
    if ((_role == 'teacher' || _role == 'faculty' || _role == 'lecturer') &&
        _currentPage == 2) {
      if (_employeeIdController.text.trim().isEmpty) {
        AppToast.show(
          context,
          message: 'Please enter your Employee ID',
          type: ToastType.warning,
        );
        return false;
      }
    }
    if (_role == 'student' && _currentPage == 2) {
      if (_usnController.text.trim().isEmpty) {
        AppToast.show(
          context,
          message: 'Please enter your Student ID/USN',
          type: ToastType.warning,
        );
        return false;
      }
    }
    return true;
  }

  bool _isFaceIdPage(int page) {
    return (_role == 'teacher' ||
            _role == 'faculty' ||
            _role == 'lecturer' ||
            _role == 'student') &&
        page == 3;
  }

  void _nextPage() async {
    if (!_validateCurrentStep()) return;
    if (_isFaceIdPage(_currentPage) && !_scanComplete) {
      AppToast.show(
        context,
        message: 'Please complete face scan first',
        type: ToastType.warning,
      );
      return;
    }
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(duration: 500.ms, curve: Curves.easeInOutCubic);
    } else {
      await _handleComplete();
    }
  }

  Future<void> _handleComplete() async {
    final rnd = Random();
    final Map<String, dynamic> profileData;
    if (_role == 'teacher' || _role == 'faculty' || _role == 'lecturer') {
      profileData = {
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
            : 'EMP-${1000 + rnd.nextInt(9000)}',
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
      };
    } else if (_role == 'parent') {
      profileData = {
        'full_name': _nameController.text.isNotEmpty
            ? _nameController.text
            : 'Parent',
        'phone': _phoneController.text.isNotEmpty
            ? _phoneController.text
            : '1234567890',
        'child_usn': _usnController.text,
        'relationship': _sectionController.text,
        'setup_completed': true,
      };
    } else if (_role == 'admin') {
      profileData = {
        'full_name': _nameController.text.isNotEmpty
            ? _nameController.text
            : 'Admin',
        'phone': _phoneController.text.isNotEmpty
            ? _phoneController.text
            : '1234567890',
        'setup_completed': true,
      };
    } else {
      profileData = {
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
            : 'USN-${1000 + rnd.nextInt(9000)}',
        'student_id': _usnController.text.isNotEmpty
            ? _usnController.text
            : 'USN-${1000 + rnd.nextInt(9000)}',
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
    }

    final session = context.read<SessionManager>();
    if (_token.isNotEmpty) {
      await ApiService.updateProfile(profileData, _token);
      if (!mounted) return;
      await session.saveSession(
        token: _token,
        email: _email,
        role: _role,
        name: profileData['full_name']?.toString(),
        biometricRegistered: _scanComplete,
        introCompleted: true,
        wizardCompleted: true,
      );
    } else {
      await session.setWizardCompleted(true);
    }
  }

  // ─── BUILD ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PremiumBackground(
        immersive: false,
        child: Column(
          children: [
            HeroOrbBackground(
              isCompact: true,
              onBackTap: _currentPage > 0
                  ? () => _pageController.previousPage(
                      duration: 400.ms,
                      curve: Curves.easeOut,
                    )
                  : null,
              child: _buildHeroContent(),
            ),
            Expanded(
              child: Transform.translate(
                offset: const Offset(0, -28),
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  physics: const NeverScrollableScrollPhysics(),
                  children: _getPagesForRole(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroContent() {
    final titles = _pageTitles();
    final title = _currentPage < titles.length ? titles[_currentPage] : 'Setup';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          'STEP ${_currentPage + 1} OF $_totalPages',
          style: AuthDesign.fontPoppins(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Colors.white,
            opacity: 0.7,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: AuthDesign.fontPoppins(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: (_currentPage + 1) / _totalPages,
            minHeight: 3,
            backgroundColor: Colors.white.withValues(alpha: 0.25),
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        ),
      ],
    );
  }

  List<String> _pageTitles() {
    if (_role == 'teacher' || _role == 'faculty' || _role == 'lecturer') {
      return [
        'Welcome',
        'Personal Info',
        'Professional Info',
        'Set up Face ID',
        'All Done!',
      ];
    } else if (_role == 'admin') {
      return ['Welcome', 'Personal Info', 'All Done!'];
    } else if (_role == 'parent') {
      return ['Welcome', 'Personal Info', 'All Done!'];
    }
    return [
      'Welcome',
      'Personal Info',
      'Campus Details',
      'Set up Face ID',
      'All Done!',
    ];
  }

  List<Widget> _getPagesForRole() {
    if (_role == 'teacher' || _role == 'faculty' || _role == 'lecturer') {
      return [
        _buildWelcomeCard(),
        _buildPersonalCard(),
        _buildProfessionalCard(),
        _buildFaceIdCard(),
        _buildCompletionCard(),
      ];
    } else if (_role == 'admin') {
      return [
        _buildWelcomeCard(),
        _buildPersonalCard(),
        _buildCompletionCard(),
      ];
    } else if (_role == 'parent') {
      return [
        _buildWelcomeCard(),
        _buildPersonalCard(),
        _buildCompletionCard(),
      ];
    }
    return [
      _buildWelcomeCard(),
      _buildPersonalCard(),
      _buildCollegeCard(),
      _buildFaceIdCard(),
      _buildCompletionCard(),
    ];
  }

  // ─── CARD SHELL ──────────────────────────────────────────────────────────

  Widget _buildCardShell({required List<Widget> children}) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: IntrinsicHeight(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(22, 24, 22, 28),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.cardDark
                          : Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.borderDark
                            : AppColors.borderLight,
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.black38
                              : AppColors.primary.withValues(alpha: 0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: children,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.04, end: 0);
  }

  // ─── WELCOME ─────────────────────────────────────────────────────────────

  Widget _buildWelcomeCard() {
    final roleLabel = _role[0].toUpperCase() + _role.substring(1);
    return _buildCardShell(
      children: [
        Text(
          'Welcome to SmartFace',
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          "Let's set up your smart campus profile in a few quick steps.",
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 28),
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: AuthDesign.primaryIndigo.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(50),
              border: Border.all(
                color: AuthDesign.primaryIndigo.withValues(alpha: 0.18),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.verified_user_outlined,
                  color: AuthDesign.primaryIndigo,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  roleLabel,
                  style: AuthDesign.fontPoppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AuthDesign.primaryIndigo,
                  ),
                ),
              ],
            ),
          ).animate().scale(duration: 700.ms, curve: Curves.elasticOut),
        ),
        const SizedBox(height: 28),
        _buildNextButton(label: 'Get Started'),
      ],
    );
  }

  // ─── PERSONAL ────────────────────────────────────────────────────────────

  Widget _buildPersonalCard() {
    if (_genderController.text.isEmpty) {
      _genderController.text = 'Male';
    }
    return _buildCardShell(
      children: [
        Text(
          'Personal Info',
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Tell us a bit about yourself.',
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 24),
        _field('Full Name', _nameController, hint: 'Enter your full name'),
        const SizedBox(height: 16),
        _field(
          'Phone Number',
          _phoneController,
          hint: '+91 00000 00000',
          type: TextInputType.phone,
        ),
        const SizedBox(height: 16),
        _field(
          'Date of Birth',
          _dobController,
          hint: 'DD/MM/YYYY',
          readOnly: true,
          onTap: () => _selectDate(context),
        ),
        const SizedBox(height: 16),
        _buildGenderSelector(),
        const SizedBox(height: 28),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildGenderSelector() {
    final genders = ['Male', 'Female', 'Other'];
    final current = _genderController.text;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'GENDER',
          style: AuthDesign.fontPoppins(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: genders.map((g) {
            final isSelected = current == g;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _genderController.text = g;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AuthDesign.primaryIndigo.withValues(alpha: 0.08)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? AuthDesign.primaryIndigo
                          : AuthDesign.textPlaceholder.withValues(alpha: 0.3),
                      width: isSelected ? 1.8 : 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      g,
                      style: AuthDesign.fontPoppins(
                        fontSize: 12,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelected
                            ? AuthDesign.primaryIndigo
                            : AuthDesign.textHeading,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ─── PROFESSIONAL ────────────────────────────────────────────────────────

  Widget _buildProfessionalCard() {
    return _buildCardShell(
      children: [
        Text(
          'Professional Info',
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Specify your academic background.',
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 24),
        _field('Employee ID', _employeeIdController, hint: 'e.g. EMP-1001'),
        const SizedBox(height: 16),
        _field(
          'Designation',
          _designationController,
          hint: 'e.g. Associate Professor',
        ),
        const SizedBox(height: 16),
        _field(
          'Specialization',
          _specializationController,
          hint: 'e.g. Computer Science',
        ),
        const SizedBox(height: 16),
        _field(
          'Qualification',
          _qualificationController,
          hint: 'e.g. Ph.D., M.Tech',
        ),
        const SizedBox(height: 16),
        _field(
          'Years of Experience',
          _experienceController,
          hint: 'e.g. 5',
          type: TextInputType.number,
        ),
        const SizedBox(height: 28),
        _buildNextButton(),
      ],
    );
  }

  // ─── CAMPUS ──────────────────────────────────────────────────────────────

  Widget _buildCollegeCard() {
    return _buildCardShell(
      children: [
        Text(
          'Campus Details',
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Connect with your institution.',
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 24),
        _field('Student ID / USN', _usnController, hint: 'e.g. 1AB22CS001'),
        const SizedBox(height: 16),
        _field(
          'Class / Course',
          _courseController,
          hint: 'e.g. B.E. Computer Science',
        ),
        const SizedBox(height: 16),
        _field('Section', _sectionController, hint: 'e.g. A'),
        const SizedBox(height: 16),
        _field(
          'Roll Number',
          _rollNoController,
          hint: 'e.g. 23',
          type: TextInputType.number,
        ),
        const SizedBox(height: 16),
        _field('Semester', _semController, hint: 'e.g. Semester 6'),
        const SizedBox(height: 28),
        _buildNextButton(),
      ],
    );
  }

  // ─── FACE ID ─────────────────────────────────────────────────────────────

  Widget _buildFaceIdCard() {
    return _buildCardShell(
      children: [
        Text(
          'Set up Face ID',
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Last step — register your face for instant attendance.',
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 28),

        // Dashed scan circle
        Center(child: _DashedScanCircle(isComplete: _scanComplete)),
        const SizedBox(height: 28),

        // Checklist
        _buildChecklist(),
        const SizedBox(height: 28),

        // Button: after scan complete show Continue, else show Start
        if (_scanComplete)
          _buildNextButton(label: 'Continue →')
        else
          PrimaryButton(
            text: 'Start face scan',
            isLoading: _isScanLoading,
            onPressed: _startFaceScan,
          ),
      ],
    );
  }

  Widget _buildChecklist() {
    final items = [
      const _CheckItem('Account created', done: true),
      const _CheckItem('Role selected', done: true),
      _CheckItem(
        'Face scan registration',
        done: _scanComplete,
        isCurrent: !_scanComplete,
      ),
    ];
    return Column(children: items.map(_buildChecklistRow).toList());
  }

  Widget _buildChecklistRow(_CheckItem step) {
    final color = step.done
        ? const Color(0xFF22C55E)
        : (step.isCurrent
              ? AuthDesign.primaryIndigo
              : AuthDesign.textPlaceholder);
    final icon = step.done
        ? Icons.check_circle_rounded
        : (step.isCurrent
              ? Icons.radio_button_checked_rounded
              : Icons.radio_button_unchecked_rounded);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Text(
            step.label,
            style: AuthDesign.fontPoppins(
              fontSize: 12,
              fontWeight: step.isCurrent ? FontWeight.w600 : FontWeight.w400,
              color: step.done
                  ? AuthDesign.textHeading
                  : (step.isCurrent
                        ? AuthDesign.primaryIndigo
                        : AuthDesign.textLabel),
            ),
          ),
          if (step.isCurrent) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AuthDesign.primaryIndigo.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Text(
                'current',
                style: AuthDesign.fontPoppins(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: AuthDesign.primaryIndigo,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _startFaceScan() async {
    setState(() => _isScanLoading = true);
    await Future.delayed(const Duration(milliseconds: 800));
    final result = await ApiService.registerBiometric(
      _email.isNotEmpty ? _email : 'test@student.com',
      _token,
    );
    if (!mounted) return;
    setState(() => _isScanLoading = false);
    if (result.containsKey('message') || result.containsKey('success')) {
      setState(() => _scanComplete = true);
      context.read<SessionManager>().setBiometricRegistered(true);
      AppToast.show(
        context,
        title: 'Face ID Registered',
        message: 'Your face has been registered successfully.',
        type: ToastType.success,
      );
    } else {
      AppToast.show(
        context,
        message: 'Face scan failed. Please try again.',
        type: ToastType.error,
      );
    }
  }

  // ─── COMPLETION ──────────────────────────────────────────────────────────

  Widget _buildCompletionCard() {
    return _buildCardShell(
      children: [
        Text(
          "You're all set!",
          style: AuthDesign.fontPoppins(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AuthDesign.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Your smart campus profile is ready for action.',
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 32),
        Center(
          child: const Icon(
            Icons.check_circle_outline_rounded,
            size: 80,
            color: Color(0xFF22C55E),
          ).animate().scale(duration: 700.ms, curve: Curves.elasticOut),
        ),
        const SizedBox(height: 32),
        _buildNextButton(label: 'Enter Dashboard →'),
      ],
    );
  }

  // ─── SHARED HELPERS ──────────────────────────────────────────────────────

  Widget _field(
    String label,
    TextEditingController controller, {
    String? hint,
    bool readOnly = false,
    VoidCallback? onTap,
    TextInputType? type,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: AuthDesign.fontPoppins(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
            color: AuthDesign.textLabel,
          ),
        ),
        const SizedBox(height: 6),
        _WizardTextField(
          controller: controller,
          hintText: hint ?? label,
          readOnly: readOnly,
          onTap: onTap,
          keyboardType: type,
        ),
      ],
    );
  }

  Widget _buildNextButton({String? label}) {
    final isLast = _currentPage == _totalPages - 1;
    return PrimaryButton(
      text: label ?? (isLast ? 'Enter Dashboard' : 'Continue'),
      onPressed: _nextPage,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashed scan circle widget
// ─────────────────────────────────────────────────────────────────────────────

class _DashedScanCircle extends StatelessWidget {
  final bool isComplete;
  const _DashedScanCircle({required this.isComplete});

  @override
  Widget build(BuildContext context) {
    const double size = 140;
    const p = AuthDesign.primaryIndigo;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      child: isComplete
          ? Container(
              key: const ValueKey('done'),
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: p.withValues(alpha: 0.08),
                border: Border.all(color: p, width: 2),
              ),
              child: const Icon(
                Icons.check_circle_outline_rounded,
                size: 56,
                color: p,
              ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
            )
          : CustomPaint(
              key: const ValueKey('scan'),
              painter: const _DashedCirclePainter(color: p),
              child: SizedBox(
                width: size,
                height: size,
                child: Center(
                  child:
                      const Icon(Icons.face_unlock_outlined, size: 44, color: p)
                          .animate(onPlay: (c) => c.repeat(reverse: true))
                          .scale(
                            begin: const Offset(0.95, 0.95),
                            end: const Offset(1.05, 1.05),
                            duration: 1200.ms,
                          ),
                ),
              ),
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashed circle painter
// ─────────────────────────────────────────────────────────────────────────────

class _DashedCirclePainter extends CustomPainter {
  final Color color;
  const _DashedCirclePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    const dashCount = 24;
    const dashAngle = (2 * 3.14159265) / dashCount;
    const gapFraction = 0.45;

    for (int i = 0; i < dashCount; i++) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * dashAngle,
        dashAngle * (1 - gapFraction),
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _DashedCirclePainter old) => old.color != color;
}

// ─────────────────────────────────────────────────────────────────────────────
// Underline-style text field
// ─────────────────────────────────────────────────────────────────────────────

class _WizardTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hintText;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextInputType? keyboardType;

  const _WizardTextField({
    required this.controller,
    required this.hintText,
    this.readOnly = false,
    this.onTap,
    this.keyboardType,
  });

  @override
  State<_WizardTextField> createState() => _WizardTextFieldState();
}

class _WizardTextFieldState extends State<_WizardTextField> {
  final _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(
      () => setState(() => _isFocused = _focusNode.hasFocus),
    );
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: _isFocused
                ? AuthDesign.underlineFocused
                : AuthDesign.underlineUnfocused,
            width: _isFocused ? 1.8 : 1.2,
          ),
        ),
      ),
      child: TextField(
        controller: widget.controller,
        focusNode: _focusNode,
        readOnly: widget.readOnly,
        onTap: widget.onTap,
        keyboardType: widget.keyboardType,
        style: AuthDesign.fontPoppins(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: AuthDesign.textHeading,
        ),
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textPlaceholder,
          ),
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data helper
// ─────────────────────────────────────────────────────────────────────────────

class _CheckItem {
  final String label;
  final bool done;
  final bool isCurrent;
  const _CheckItem(this.label, {required this.done, this.isCurrent = false});
}
