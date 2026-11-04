/*
|--------------------------------------------------------------------------
| File: student_profile_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the student-specific detailed profile dashboard screen. Supports photo
| uploads, personal details form fields, and academic attribute syncs with MongoDB.
|
| Responsibilities:
| - Renders detailed personal, academic, and guardian records.
| - Manages text edit state transitions to update attributes locally.
| - Triggers profile saves to MongoDB via ApiService.updateProfile.
| - Supports local profile avatar updates.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:image_picker/image_picker.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

// ======================================================
// State & Core Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

// ======================================================
// Services Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen widget for student-specific profile management.
class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen>
    with TickerProviderStateMixin {
  // ── State ─────────────────────────────────────────────────────────────────
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploadingPhoto = false;
  bool _isEditing = false;
  bool _hasUnsavedChanges = false;
  File? _localAvatarFile;

  Map<String, dynamic> _profileData = {};

  // ── Form controllers ──────────────────────────────────────────────────────
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _dobCtrl;
  late TextEditingController _genderCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _usnCtrl;
  late TextEditingController _courseCtrl;
  late TextEditingController _sectionCtrl;
  late TextEditingController _rollNoCtrl;
  late TextEditingController _parentCtrl;
  late TextEditingController _collegeCtrl;
  late TextEditingController _semesterCtrl;
  String _languagePref = 'English';

  // ── Animations ────────────────────────────────────────────────────────────
  late AnimationController _pulseCtrl;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _initControllers();

    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchProfile());
  }

  void _initControllers({Map<String, dynamic>? data}) {
    final d = data ?? {};
    _nameCtrl = TextEditingController(text: d['full_name'] ?? '');
    _phoneCtrl = TextEditingController(text: d['phone'] ?? '');
    _dobCtrl = TextEditingController(text: d['dob'] ?? '');
    _genderCtrl = TextEditingController(text: d['gender'] ?? '');
    _addressCtrl = TextEditingController(text: d['address'] ?? '');
    _usnCtrl = TextEditingController(text: d['usn'] ?? d['student_id'] ?? '');
    _courseCtrl = TextEditingController(
      text: d['course'] ?? d['college'] ?? '',
    );
    _sectionCtrl = TextEditingController(
      text: d['section'] ?? d['department'] ?? '',
    );
    _rollNoCtrl = TextEditingController(
      text: d['roll_number'] ?? d['semester'] ?? '',
    );
    _parentCtrl = TextEditingController(text: d['parent_details'] ?? '');
    _collegeCtrl = TextEditingController(text: d['college'] ?? '');
    _semesterCtrl = TextEditingController(text: d['semester'] ?? '');
    _languagePref = d['language_preference'] ?? 'English';
  }

  void _disposeControllers() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _dobCtrl.dispose();
    _genderCtrl.dispose();
    _addressCtrl.dispose();
    _usnCtrl.dispose();
    _courseCtrl.dispose();
    _sectionCtrl.dispose();
    _rollNoCtrl.dispose();
    _parentCtrl.dispose();
    _collegeCtrl.dispose();
    _semesterCtrl.dispose();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _disposeControllers();
    super.dispose();
  }

  // ── API: Fetch Profile ────────────────────────────────────────────────────
  Future<void> _fetchProfile() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final session = context.read<SessionManager>();
      final token = session.token ?? '';

      if (token.isEmpty) {
        // Demo fallback
        final demo = {
          'full_name': session.name ?? 'Demo Student',
          'email': session.email ?? 'student@demo.com',
          'phone': '',
          'dob': '',
          'gender': '',
          'address': '',
          'usn': '',
          'course': '',
          'section': '',
          'roll_number': '',
          'parent_details': '',
          'college': '',
          'semester': '',
          'language_preference': 'English',
          'role': 'student',
        };
        _applyProfileData(demo);
        return;
      }

      final res = await ApiService.getUserProfile(token);

      if (!mounted) return;

      if (res.containsKey('email')) {
        _applyProfileData(res);
      } else {
        _showError(
          'Could not load profile: ${res['detail'] ?? 'Unknown error'}',
        );
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (!mounted) return;
      _showError('Failed to load profile: $e');
      setState(() => _isLoading = false);
    }
  }

  void _applyProfileData(Map<String, dynamic> data) {
    _disposeControllers();
    _initControllers(data: data);
    setState(() {
      _profileData = data;
      _isLoading = false;
      _hasUnsavedChanges = false;
    });
  }

  // ── API: Save Profile ─────────────────────────────────────────────────────
  Future<void> _saveProfile() async {
    if (!mounted) return;
    setState(() => _isSaving = true);

    try {
      final session = context.read<SessionManager>();
      final token = session.token ?? '';

      final payload = {
        'full_name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'dob': _dobCtrl.text.trim(),
        'gender': _genderCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'usn': _usnCtrl.text.trim(),
        'student_id': _usnCtrl.text.trim(),
        'course': _courseCtrl.text.trim(),
        'college': _collegeCtrl.text.trim(),
        'section': _sectionCtrl.text.trim(),
        'roll_number': _rollNoCtrl.text.trim(),
        'parent_details': _parentCtrl.text.trim(),
        'semester': _semesterCtrl.text.trim(),
        'language_preference': _languagePref,
      };

      if (token.isNotEmpty) {
        final result = await ApiService.updateProfile(payload, token);
        if (!mounted) return;

        if (result.containsKey('detail') &&
            result['detail'] != null &&
            !result['detail'].toString().contains('success')) {
          _showError('Save failed: ${result['detail']}');
          setState(() => _isSaving = false);
          return;
        }
      }

      if (!mounted) return;

      // Re-fetch to confirm server state
      await _fetchProfile();

      setState(() {
        _isSaving = false;
        _isEditing = false;
        _hasUnsavedChanges = false;
      });

      _showSuccess('Profile saved successfully! ✓');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      _showError('Failed to save: $e');
    }
  }

  // ── Photo Upload ──────────────────────────────────────────────────────────
  void _showPhotoSheet() {
    final session = context.read<SessionManager>();
    final String? currentPhoto = (_profileData['profilePhotoUrl'] ??
            _profileData['avatar_url'] ??
            session.avatarUrl)
        ?.toString();
    final bool hasExistingPhoto =
        (currentPhoto != null &&
            currentPhoto.trim().isNotEmpty &&
            currentPhoto != 'null') ||
        _localAvatarFile != null;

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          MediaQuery.of(ctx).padding.bottom + 24,
        ),
        decoration: BoxDecoration(
          color: const Color(0xFF0D1130),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(
            color: AppColors.gold.withValues(alpha: 0.35),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.8),
              blurRadius: 30,
              spreadRadius: 8,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Update Profile Photo',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'JPEG, PNG or WEBP · Max 5 MB',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.white54),
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(
                  child: _photoSourceBtn(
                    Icons.photo_library_rounded,
                    'Gallery',
                    'Choose image',
                    () {
                      Navigator.of(ctx).pop();
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _photoSourceBtn(
                    Icons.camera_alt_rounded,
                    'Camera',
                    'Take photo',
                    () {
                      Navigator.of(ctx).pop();
                      _pickImage(ImageSource.camera);
                    },
                  ),
                ),
              ],
            ),
            if (hasExistingPhoto) ...[
              const SizedBox(height: 16),
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _deleteProfilePhoto();
                  },
                  borderRadius: BorderRadius.circular(16),
                  splashColor: Colors.redAccent.withValues(alpha: 0.2),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.redAccent.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.delete_outline_rounded,
                          color: Colors.redAccent,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Remove Current Photo',
                          style: GoogleFonts.inter(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _photoSourceBtn(
    IconData icon,
    String label,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: AppColors.gold.withValues(alpha: 0.15),
        highlightColor: AppColors.gold.withValues(alpha: 0.08),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 10),
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.gold, size: 26),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      if (picked == null) return;

      File file;
      try {
        final croppedFile = await ImageCropper().cropImage(
          sourcePath: picked.path,
          aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
          uiSettings: [
            AndroidUiSettings(
              toolbarTitle: 'Crop Profile Photo',
              toolbarColor: const Color(0xFF0D1130),
              toolbarWidgetColor: Colors.white,
              initAspectRatio: CropAspectRatioPreset.square,
              lockAspectRatio: true,
              activeControlsWidgetColor: AppColors.gold,
              backgroundColor: const Color(0xFF070B1A),
            ),
            IOSUiSettings(
              title: 'Crop Profile Photo',
              aspectRatioLockEnabled: true,
            ),
          ],
        );
        file = croppedFile != null ? File(croppedFile.path) : File(picked.path);
      } catch (cropErr) {
        debugPrint('Image cropper fallback to picked file: $cropErr');
        file = File(picked.path);
      }

      final bytes = await file.readAsBytes();
      if (bytes.length > 5 * 1024 * 1024) {
        _showError('Image too large. Max 5 MB allowed.');
        return;
      }

      setState(() {
        _localAvatarFile = file;
        _isUploadingPhoto = true;
      });

      if (!mounted) return;
      final session = context.read<SessionManager>();
      final token = session.token ?? '';

      if (token.isEmpty) {
        await Future.delayed(const Duration(milliseconds: 600));
        if (mounted) {
          setState(() => _isUploadingPhoto = false);
          _showSuccess('Preview updated (demo mode).');
        }
        return;
      }

      final result = await ApiService.uploadAvatar(file, token);
      if (!mounted) return;

      final String? photoUrl =
          (result['profilePhotoUrl'] ?? result['avatar_url']) as String?;

      if (photoUrl != null && photoUrl.isNotEmpty) {
        setState(() {
          _profileData['avatar_url'] = photoUrl;
          _profileData['profilePhotoUrl'] = photoUrl;
          _isUploadingPhoto = false;
        });
        await session.updateAvatarUrl(photoUrl);
        if (mounted) {
          _showSuccess('Profile photo updated successfully! ✓');
        }
      } else {
        setState(() {
          _localAvatarFile = null;
          _isUploadingPhoto = false;
        });
        _showError(result['detail'] ?? 'Photo upload failed.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _localAvatarFile = null;
        _isUploadingPhoto = false;
      });
      _showError('Error: $e');
    }
  }

  Future<void> _deleteProfilePhoto() async {
    final confirmed = await PremiumDialogs.showConfirmDialog(
      context,
      title: 'Remove Profile Photo',
      message: 'Are you sure you want to remove your current profile photo?',
      confirmLabel: 'REMOVE',
      cancelLabel: 'CANCEL',
      isDestructive: true,
      icon: Icons.delete_outline_rounded,
    );
    if (confirmed != true || !mounted) return;

    setState(() => _isUploadingPhoto = true);
    try {
      final session = context.read<SessionManager>();
      final token = session.token ?? '';
      if (token.isNotEmpty) {
        await ApiService.deleteProfilePhoto(token);
      }
      if (!mounted) return;
      setState(() {
        _localAvatarFile = null;
        _profileData['avatar_url'] = null;
        _profileData['profilePhotoUrl'] = null;
        _isUploadingPhoto = false;
      });
      await session.updateAvatarUrl(null);
      _showSuccess('Profile photo removed.');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploadingPhoto = false);
      _showError('Failed to remove photo: $e');
    }
  }

  // ── Snack helpers ─────────────────────────────────────────────────────────
  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.check_circle_outline,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(msg, style: GoogleFonts.inter())),
          ],
        ),
        backgroundColor: const Color(0xFF1A8F5E),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(msg, style: GoogleFonts.inter())),
          ],
        ),
        backgroundColor: Colors.redAccent.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  String get _initials {
    final name = (_profileData['full_name'] ?? _nameCtrl.text)
        .toString()
        .trim();
    return name
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0])
        .take(2)
        .join()
        .toUpperCase();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BUILD
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumBackground(
      immersive: false,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: _buildAppBar(),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
              )
            : RefreshIndicator(
                onRefresh: _fetchProfile,
                color: const Color(0xFF4F46E5),
                backgroundColor: const Color(0xFF070B1A),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 110),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 8),
                      _buildAvatarSection()
                          .animate()
                          .fadeIn(duration: 400.ms)
                          .scale(delay: 100.ms),
                      const SizedBox(height: 8),
                      Text(
                        'Tap photo to update',
                        style: GoogleFonts.inter(
                          color: isDark ? Colors.white30 : Colors.black38,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Name + role badge
                      Text(
                        _nameCtrl.text.isNotEmpty
                            ? _nameCtrl.text
                            : (_profileData['full_name'] ?? 'Student'),
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ).animate().fadeIn(delay: 150.ms),
                      const SizedBox(height: 6),
                      _buildRoleBadge(),
                      const SizedBox(height: 20),

                      // ── Quick Stats Row ──────────────────────────────────────
                      const Row(
                        children: [
                          Expanded(
                            child: MetricCard(
                              label: 'Attendance Rate',
                              value: '92.4%',
                              icon: Icons.done_all_rounded,
                              accentColor: Color(0xFF00C6FF),
                            ),
                          ),
                          SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: MetricCard(
                              label: 'Attended',
                              value: '120/130',
                              icon: Icons.assignment_turned_in_rounded,
                              accentColor: Color(0xFFFFD700),
                            ),
                          ),
                          SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: MetricCard(
                              label: 'Leave Days',
                              value: '2 Days',
                              icon: Icons.time_to_leave_rounded,
                              accentColor: Color(0xFF7B2FF7),
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

                      const SizedBox(height: 28),

                      // Edit / Save banner
                      if (!_isEditing) _buildEditBanner(),
                      if (_isEditing) _buildSaveBanner(),

                      const SizedBox(height: 20),

                      // ── Sections ──────────────────────────────────────
                      _buildSection(
                        icon: Icons.person_outline_rounded,
                        title: 'PERSONAL INFORMATION',
                        color: const Color(0xFF00C6FF),
                        children: [
                          _field('Full Name', Icons.person_outline, _nameCtrl),
                          _field(
                            'Phone Number',
                            Icons.phone_android_outlined,
                            _phoneCtrl,
                            keyboardType: TextInputType.phone,
                          ),
                          _fieldWithDatePicker(
                            'Date of Birth',
                            Icons.calendar_today_outlined,
                            _dobCtrl,
                          ),
                          _dropdownField(
                            'Gender',
                            Icons.wc_outlined,
                            _genderCtrl.text.isEmpty ? null : _genderCtrl.text,
                            ['Male', 'Female', 'Other', 'Prefer not to say'],
                            (val) {
                              _genderCtrl.text = val ?? '';
                              setState(() => _hasUnsavedChanges = true);
                            },
                          ),
                          _field(
                            'Home Address',
                            Icons.home_outlined,
                            _addressCtrl,
                            maxLines: 2,
                          ),
                          _dropdownField(
                            'Language Preference',
                            Icons.language_outlined,
                            _languagePref,
                            ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu'],
                            (val) => setState(() {
                              _languagePref = val ?? 'English';
                              _hasUnsavedChanges = true;
                            }),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      _buildSection(
                        icon: Icons.school_outlined,
                        title: 'ACADEMIC INFORMATION',
                        color: const Color(0xFFFFD700),
                        children: [
                          _field(
                            'Student ID / USN',
                            Icons.badge_outlined,
                            _usnCtrl,
                          ),
                          _field(
                            'Class / Course',
                            Icons.school_outlined,
                            _courseCtrl,
                          ),
                          _field(
                            'College / University',
                            Icons.account_balance_outlined,
                            _collegeCtrl,
                          ),
                          _field(
                            'Section',
                            Icons.grid_view_outlined,
                            _sectionCtrl,
                          ),
                          _field(
                            'Roll Number',
                            Icons.format_list_numbered_outlined,
                            _rollNoCtrl,
                          ),
                          _field(
                            'Semester / Year',
                            Icons.timeline_outlined,
                            _semesterCtrl,
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      _buildSection(
                        icon: Icons.family_restroom_outlined,
                        title: 'PARENT / GUARDIAN',
                        color: const Color(0xFF7B2FF7),
                        children: [
                          _field(
                            'Parent / Guardian Name & Contact',
                            Icons.family_restroom_outlined,
                            _parentCtrl,
                            maxLines: 2,
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // ── Account Info (read-only) ───────────────────────
                      _buildSection(
                        icon: Icons.lock_outline_rounded,
                        title: 'ACCOUNT & SECURITY',
                        color: Colors.blueAccent,
                        children: [
                          _readOnlyTile(
                            'Institutional Email',
                            Icons.email_outlined,
                            _profileData['email'] ?? 'N/A',
                          ),
                          _readOnlyTile(
                            'Account Role',
                            Icons.badge_outlined,
                            (_profileData['role'] ?? 'student')
                                .toString()
                                .toUpperCase(),
                          ),
                          _readOnlyTile(
                            'Biometric Status',
                            Icons.fingerprint_rounded,
                            _profileData['biometric_registered'] == true
                                ? 'Registered ✓'
                                : 'Not Registered',
                            valueColor:
                                _profileData['biometric_registered'] == true
                                ? const Color(0xFF00FF88)
                                : Colors.orangeAccent,
                          ),
                        ],
                      ),

                      const SizedBox(height: 30),

                      // ── App About (read-only) ───────────────────────
                      if (!_isEditing) ...[
                        _buildSection(
                          icon: Icons.info_outline_rounded,
                          title: 'APP INFORMATION',
                          color: AppColors.cyan,
                          children: [
                            GestureDetector(
                              onTap: () {
                                showAboutDialog(
                                  context: context,
                                  applicationName: 'Smart Attendance AI',
                                  applicationVersion: '1.0.0',
                                  applicationIcon: Padding(
                                    padding: const EdgeInsets.all(4.0),
                                    child: Image.asset(
                                      'assets/images/logo.png',
                                      width: 48,
                                      height: 48,
                                    ),
                                  ),
                                  applicationLegalese:
                                      '© 2026 SmartFace AI Team. All rights reserved.',
                                );
                              },
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.logo_dev_rounded,
                                    color: AppColors.cyan,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'ABOUT SMARTFACE',
                                          style: GoogleFonts.inter(
                                            color: isDark
                                                ? Colors.white38
                                                : Colors.black45,
                                            fontSize: 10,
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          'Smart Attendance AI v1.0.0',
                                          style: GoogleFonts.inter(
                                            color: isDark
                                                ? Colors.white
                                                : Colors.black87,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: Colors.white38,
                                    size: 18,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                      ],

                      // ── Save Button (shown in edit mode) ───────────────
                      if (_isEditing) _buildSaveButton(),

                      // ── Logout Button (shown in read-only mode) ───────────
                      if (!_isEditing) ...[
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: GlowButton(
                            onPressed: () async {
                              final confirmed =
                                  await PremiumDialogs.showConfirmDialog(
                                    context,
                                    title: 'Confirm Logout',
                                    message:
                                        'Are you sure you want to sign out? Your offline session context will be safely cleared.',
                                    confirmLabel: 'LOGOUT',
                                    cancelLabel: 'CANCEL',
                                    isDestructive: true,
                                    icon: Icons.logout_rounded,
                                  );
                              if (confirmed == true && context.mounted) {
                                await context.read<SessionManager>().logout();
                                if (context.mounted) {
                                  context.go('/auth/login');
                                }
                              }
                            },
                            color: AppColors.error,
                            glowColor: AppColors.error.withValues(alpha: 0.4),
                            borderRadius: 16,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.logout_rounded,
                                  size: 20,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'LOGOUT SESSION',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  // ── App Bar ───────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
    return PremiumAppBar(
      title: 'My Profile',
      actions: [
        if (!_isLoading)
          IconButton(
            onPressed: () {
              setState(() {
                _isEditing = !_isEditing;
                if (!_isEditing && _hasUnsavedChanges) {
                  // Cancelled — restore
                  _applyProfileData(_profileData);
                }
              });
            },
            icon: Icon(
              _isEditing ? Icons.close_rounded : Icons.edit_outlined,
              color: _isEditing ? const Color(0xFFEF4444) : const Color(0xFF6366F1),
            ),
          ),
        if (!_isLoading)
          IconButton(
            onPressed: _fetchProfile,
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF6366F1)),
          ),
      ],
    );
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  Widget _buildAvatarSection() {
    final session = context.watch<SessionManager>();
    final String? networkUrl = (_profileData['profilePhotoUrl'] ??
            _profileData['avatar_url'] ??
            session.avatarUrl)
        ?.toString();
    final bool hasNet = networkUrl != null &&
        networkUrl.trim().isNotEmpty &&
        networkUrl != 'null';
    final bool hasLocal = _localAvatarFile != null;

    ImageProvider? avatarImage;
    if (hasLocal) {
      avatarImage = FileImage(_localAvatarFile!);
    } else if (hasNet) {
      final cleanUrl = networkUrl.replaceAll('\\', '/');
      final full = cleanUrl.startsWith('http')
          ? cleanUrl
          : cleanUrl.startsWith('/')
              ? '${ApiService.baseUrl}$cleanUrl'
              : '${ApiService.baseUrl}/$cleanUrl';
      avatarImage = CachedNetworkImageProvider(full);
    }

    return GestureDetector(
      onTap: _isUploadingPhoto ? null : _showPhotoSheet,
      child: AnimatedBuilder(
        animation: _pulseCtrl,
        builder: (context, child) => Stack(
          alignment: Alignment.center,
          children: [
            // Glow ring
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(
                      alpha: _isUploadingPhoto
                          ? 0.1 + 0.3 * _pulseCtrl.value
                          : 0.2,
                    ),
                    blurRadius: _isUploadingPhoto ? 40 : 18,
                    spreadRadius: _isUploadingPhoto ? 8 : 3,
                  ),
                ],
              ),
            ),
            // Border
            Container(
              width: 146,
              height: 146,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.gold, width: 2),
              ),
            ),
            // Avatar circle
            CircleAvatar(
              radius: 68,
              backgroundColor: const Color(0xFF0D1130),
              backgroundImage: avatarImage,
              onBackgroundImageError: avatarImage != null
                  ? (exception, stackTrace) {
                      debugPrint('Avatar image load error: $exception');
                    }
                  : null,
              child: avatarImage == null
                  ? Text(
                      _initials.isNotEmpty ? _initials : 'ST',
                      style: GoogleFonts.inter(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    )
                  : null,
            ),
            // Upload overlay
            if (_isUploadingPhoto)
              Container(
                width: 136,
                height: 136,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withValues(alpha: 0.6),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color.lerp(
                            AppColors.gold,
                            Colors.cyanAccent,
                            _pulseCtrl.value,
                          )!,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Uploading…',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            // Camera badge
            if (!_isUploadingPhoto)
              Positioned(
                bottom: 2,
                right: 2,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.camera_alt_rounded,
                    color: Colors.black,
                    size: 18,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ── Role Badge ────────────────────────────────────────────────────────────
  Widget _buildRoleBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.verified_rounded, color: AppColors.gold, size: 14),
          const SizedBox(width: 6),
          Text(
            'STUDENT ACCOUNT',
            style: GoogleFonts.inter(
              color: AppColors.gold,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Edit Banner ───────────────────────────────────────────────────────────
  Widget _buildEditBanner() {
    return GestureDetector(
      onTap: () => setState(() => _isEditing = true),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.edit_outlined, color: AppColors.gold, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Tap to edit your profile details',
                style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: AppColors.gold,
              size: 14,
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildSaveBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF003320).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF00FF88).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.edit_note_rounded,
            color: Color(0xFF00FF88),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Editing mode • Changes saved to server',
              style: GoogleFonts.inter(
                color: const Color(0xFF00FF88),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn();
  }

  // ── Save Button ───────────────────────────────────────────────────────────
  Widget _buildSaveButton() {
    return PressableScale(
      onTap: _isSaving ? null : () {
        HapticFeedback.mediumImpact();
        _saveProfile();
      },
      child: Container(
        height: 52,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: _isSaving
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.save_rounded, size: 20, color: Colors.white),
                  const SizedBox(width: 10),
                  Text(
                    'SAVE PROFILE CHANGES',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.8,
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
      ),
    ).animate().scale(delay: 100.ms);
  }

  // ── Section Builder ───────────────────────────────────────────────────────
  Widget _buildSection({
    required IconData icon,
    required String title,
    required Color color,
    required List<Widget> children,
  }) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: color.withValues(alpha: 0.12),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: GoogleFonts.inter(
                  color: color,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(color: Colors.white10, height: 1),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  // ── Field Builders ────────────────────────────────────────────────────────
  Widget _field(
    String label,
    IconData icon,
    TextEditingController ctrl, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: isDark ? Colors.white38 : Colors.black45,
              fontSize: 10,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          if (_isEditing)
            TextField(
              controller: ctrl,
              maxLines: maxLines,
              keyboardType: keyboardType,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontSize: 14,
              ),
              onChanged: (_) => setState(() => _hasUnsavedChanges = true),
              decoration: InputDecoration(
                prefixIcon: Icon(icon, color: AppColors.gold, size: 18),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : Colors.black.withValues(alpha: 0.03),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: AppColors.gold,
                    width: 1.2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
              ),
            )
          else
            Row(
              children: [
                Icon(icon, color: AppColors.gold, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    ctrl.text.isNotEmpty ? ctrl.text : '—',
                    style: GoogleFonts.inter(
                      color: ctrl.text.isNotEmpty
                          ? (isDark ? Colors.white : Colors.black87)
                          : (isDark ? Colors.white30 : Colors.black38),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _fieldWithDatePicker(
    String label,
    IconData icon,
    TextEditingController ctrl,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: isDark ? Colors.white38 : Colors.black45,
              fontSize: 10,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          if (_isEditing)
            TextField(
              controller: ctrl,
              readOnly: true,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontSize: 14,
              ),
              decoration: InputDecoration(
                prefixIcon: Icon(icon, color: AppColors.gold, size: 18),
                suffixIcon: const Icon(
                  Icons.calendar_month_outlined,
                  color: AppColors.gold,
                  size: 18,
                ),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : Colors.black.withValues(alpha: 0.03),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: AppColors.gold,
                    width: 1.2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
              ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime(2003),
                  firstDate: DateTime(1950),
                  lastDate: DateTime.now(),
                  builder: (ctx, child) => Theme(
                    data: Theme.of(ctx).copyWith(
                      colorScheme: ColorScheme.dark(
                        primary: AppColors.gold,
                        onPrimary: Colors.black,
                        surface: isDark
                            ? const Color(0xFF0D1130)
                            : Colors.white,
                        onSurface: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    child: child!,
                  ),
                );
                if (picked != null) {
                  ctrl.text =
                      '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
                  setState(() => _hasUnsavedChanges = true);
                }
              },
            )
          else
            Row(
              children: [
                Icon(icon, color: AppColors.gold, size: 16),
                const SizedBox(width: 10),
                Text(
                  ctrl.text.isNotEmpty ? ctrl.text : '—',
                  style: GoogleFonts.inter(
                    color: ctrl.text.isNotEmpty
                        ? (isDark ? Colors.white : Colors.black87)
                        : (isDark ? Colors.white30 : Colors.black38),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _dropdownField(
    String label,
    IconData icon,
    String? value,
    List<String> options,
    ValueChanged<String?> onChanged,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: isDark ? Colors.white38 : Colors.black45,
              fontSize: 10,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          if (_isEditing)
            DropdownButtonFormField<String>(
              initialValue: options.contains(value) ? value : null,
              dropdownColor: isDark ? const Color(0xFF0D1130) : Colors.white,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontSize: 14,
              ),
              decoration: InputDecoration(
                prefixIcon: Icon(icon, color: AppColors.gold, size: 18),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : Colors.black.withValues(alpha: 0.03),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: AppColors.gold,
                    width: 1.2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
              ),
              items: options
                  .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                  .toList(),
              onChanged: onChanged,
            )
          else
            Row(
              children: [
                Icon(icon, color: AppColors.gold, size: 16),
                const SizedBox(width: 10),
                Text(
                  value != null && value.isNotEmpty ? value : '—',
                  style: GoogleFonts.inter(
                    color: (value != null && value.isNotEmpty)
                        ? (isDark ? Colors.white : Colors.black87)
                        : (isDark ? Colors.white30 : Colors.black38),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _readOnlyTile(
    String label,
    IconData icon,
    String value, {
    Color? valueColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final resolvedValueColor =
        valueColor ?? (isDark ? Colors.white70 : Colors.black87);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Icon(icon, color: Colors.blueAccent, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    color: isDark ? Colors.white38 : Colors.black45,
                    fontSize: 10,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    color: resolvedValueColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.lock_outline_rounded,
            color: isDark ? Colors.white24 : Colors.black26,
            size: 14,
          ),
        ],
      ),
    );
  }
}
