/*
|--------------------------------------------------------------------------
| File: profile_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium user profile panel. Allows students and teachers to review
| their records, upload profile photos with simulated scan indicators, and save changes.
|
| Responsibilities:
| - Fetches user attributes from ApiService.getUserProfile.
| - Renders user details in modern glassmorphic details sections.
| - Coordinates profile avatar picking, previewing, and server uploads.
| - Renders dynamic forms to update profile details.
|
| Dependencies:
| - package:flutter/material.dart
| - package:google_fonts/google_fonts.dart
| - package:flutter_animate/flutter_animate.dart
| - package:image_picker/image_picker.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/theme_controller.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';

// ======================================================
// Services Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';

/// Screen widget for user profile settings and management.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  bool _isUploading = false;
  bool _initialized = false;
  bool _isDragOver = false;
  Map<String, dynamic> _profileData = {};
  File? _localAvatarFile; // local preview before server confirms

  // Rotating scan animation controller
  late AnimationController _scanController;
  late AnimationController _pulseController;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _fetchProfile();
      _initialized = true;
    }
  }

  Future<void> _fetchProfile() async {
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? session.token ?? '';
    final email = args?['email'] ?? session.email ?? '';

    if (token.isEmpty) {
      setState(() {
        _isLoading = false;
        _profileData = {
          'full_name': 'Demo User',
          'email': email.isNotEmpty ? email : 'demo@student.com',
          'phone': '+91 98765 43210',
          'student_id': 'SF-2026-9999',
          'college': 'SmartFace University',
          'department': 'CSE',
          'semester': 'Semester 6',
          'dob': '2002-01-01',
        };
      });
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getUserProfile(token);
      if (res.containsKey('email')) {
        setState(() {
          _profileData = res;
          _isLoading = false;
        });
      } else {
        throw Exception(res['detail'] ?? 'Failed to load profile');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading profile: $e')));
    }
  }

  /// Shows bottom sheet to pick source: Gallery or Camera
  void _showImageSourceSheet() {
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
                  child: _sourceButton(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    subtitle: 'Choose image',
                    onTap: () {
                      Navigator.of(ctx).pop();
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _sourceButton(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    subtitle: 'Take photo',
                    onTap: () {
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

  Widget _sourceButton({
    required IconData icon,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
  }) {
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
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? session.token ?? '';

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
        if (!mounted) return;
        _showErrorSnack('Image too large. Please choose a file under 5 MB.');
        return;
      }

      setState(() {
        _localAvatarFile = file;
        _isUploading = true;
      });

      if (token.isEmpty) {
        await Future.delayed(const Duration(milliseconds: 800));
        if (mounted) {
          setState(() => _isUploading = false);
          _showSuccessSnack(
            'Preview updated (demo mode — not saved to server).',
          );
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
          _isUploading = false;
        });
        await session.updateAvatarUrl(photoUrl);
        if (mounted) {
          _showSuccessSnack('Profile photo updated successfully! ✓');
        }
      } else {
        setState(() {
          _localAvatarFile = null;
          _isUploading = false;
        });
        _showErrorSnack(result['detail'] ?? 'Upload failed. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _localAvatarFile = null;
        _isUploading = false;
      });
      _showErrorSnack('Error picking image: $e');
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

    setState(() => _isUploading = true);
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
        _isUploading = false;
      });
      await session.updateAvatarUrl(null);
      _showSuccessSnack('Profile photo removed.');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploading = false);
      _showErrorSnack('Failed to remove photo: $e');
    }
  }

  void _showSuccessSnack(String msg) {
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

  void _showErrorSnack(String msg) {
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

  void _showEditProfileSheet() {
    final isTeacher =
        (_profileData['role'] ?? '').toString().toLowerCase() == 'teacher';

    final nameCtrl = TextEditingController(
      text: _profileData['full_name'] ?? '',
    );
    final phoneCtrl = TextEditingController(text: _profileData['phone'] ?? '');
    final dobCtrl = TextEditingController(text: _profileData['dob'] ?? '');
    final genderCtrl = TextEditingController(
      text: _profileData['gender'] ?? '',
    );
    final addressCtrl = TextEditingController(
      text: _profileData['address'] ?? '',
    );
    final langCtrl = TextEditingController(
      text: _profileData['language_preference'] ?? 'English',
    );

    // Student fields
    final usnCtrl = TextEditingController(
      text: _profileData['usn'] ?? _profileData['student_id'] ?? '',
    );
    final courseCtrl = TextEditingController(
      text: _profileData['course'] ?? '',
    );
    final sectionCtrl = TextEditingController(
      text: _profileData['section'] ?? '',
    );
    final rollNoCtrl = TextEditingController(
      text: _profileData['roll_number'] ?? '',
    );
    final parentCtrl = TextEditingController(
      text: _profileData['parent_details'] ?? '',
    );

    // Teacher fields
    final employeeIdCtrl = TextEditingController(
      text: _profileData['employee_id'] ?? '',
    );
    final designationCtrl = TextEditingController(
      text: _profileData['designation'] ?? '',
    );
    final specializationCtrl = TextEditingController(
      text: _profileData['specialization'] ?? '',
    );
    final qualificationCtrl = TextEditingController(
      text: _profileData['qualification'] ?? '',
    );
    final experienceCtrl = TextEditingController(
      text: _profileData['experience'] ?? '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.78,
            decoration: const BoxDecoration(
              color: AppColors.bgModal,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              border: Border(
                top: BorderSide(color: AppColors.gold, width: 1.5),
              ),
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(30),
              ),
              child: Scaffold(
                backgroundColor: Colors.transparent,
                appBar: AppBar(
                  title: Text(
                    'Update Profile Details',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  leading: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                body: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24.0,
                    vertical: 10.0,
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 10),
                      _buildModalTextField(
                        'Full Name',
                        Icons.person_outline,
                        nameCtrl,
                      ),
                      const SizedBox(height: 15),
                      _buildModalTextField(
                        'Phone Number',
                        Icons.phone_android_outlined,
                        phoneCtrl,
                      ),
                      const SizedBox(height: 15),
                      _buildModalTextField(
                        'Date of Birth',
                        Icons.calendar_today_outlined,
                        dobCtrl,
                        onTap: () async {
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
                            final day = picked.day.toString().padLeft(2, '0');
                            final month = picked.month.toString().padLeft(
                              2,
                              '0',
                            );
                            final year = picked.year;
                            dobCtrl.text = '$day/$month/$year';
                          }
                        },
                      ),
                      const SizedBox(height: 15),
                      _buildModalTextField(
                        'Gender',
                        Icons.wc_outlined,
                        genderCtrl,
                      ),
                      const SizedBox(height: 15),
                      _buildModalTextField(
                        'Address',
                        Icons.home_outlined,
                        addressCtrl,
                      ),
                      const SizedBox(height: 15),
                      DropdownButtonFormField<String>(
                        initialValue:
                            ['English', 'Kannada'].contains(langCtrl.text)
                            ? langCtrl.text
                            : 'English',
                        dropdownColor: AppColors.bgModal,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Language Preference',
                          labelStyle: const TextStyle(
                            color: Colors.white38,
                            fontSize: 13,
                          ),
                          prefixIcon: const Icon(
                            Icons.language_outlined,
                            color: AppColors.gold,
                            size: 20,
                          ),
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.03),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Colors.white12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.gold,
                              width: 1,
                            ),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'English',
                            child: Text('English'),
                          ),
                          DropdownMenuItem(
                            value: 'Kannada',
                            child: Text('Kannada'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            langCtrl.text = val;
                          }
                        },
                      ),
                      const SizedBox(height: 15),
                      if (isTeacher) ...[
                        _buildModalTextField(
                          'Employee ID',
                          Icons.badge_outlined,
                          employeeIdCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Designation',
                          Icons.work_outline,
                          designationCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Subject Specialization',
                          Icons.menu_book_outlined,
                          specializationCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Qualification',
                          Icons.school_outlined,
                          qualificationCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Years of Experience',
                          Icons.timeline_outlined,
                          experienceCtrl,
                        ),
                      ] else ...[
                        _buildModalTextField(
                          'Student ID / USN',
                          Icons.badge_outlined,
                          usnCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Class / Course',
                          Icons.school_outlined,
                          courseCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Section',
                          Icons.grid_view_outlined,
                          sectionCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Roll Number',
                          Icons.format_list_numbered_outlined,
                          rollNoCtrl,
                        ),
                        const SizedBox(height: 15),
                        _buildModalTextField(
                          'Parent / Guardian Details',
                          Icons.family_restroom_outlined,
                          parentCtrl,
                        ),
                      ],
                      const SizedBox(height: 35),
                      GlowButton(
                        onPressed: () async {
                          final session = this.context.read<SessionManager>();
                          final args =
                              ModalRoute.of(this.context)?.settings.arguments
                                  as Map?;
                          final token = args?['token'] ?? session.token ?? '';
                          final updatedData = isTeacher
                              ? {
                                  'full_name': nameCtrl.text.trim(),
                                  'phone': phoneCtrl.text.trim(),
                                  'dob': dobCtrl.text.trim(),
                                  'gender': genderCtrl.text.trim(),
                                  'address': addressCtrl.text.trim(),
                                  'language_preference': langCtrl.text.trim(),
                                  'employee_id': employeeIdCtrl.text.trim(),
                                  'designation': designationCtrl.text.trim(),
                                  'specialization': specializationCtrl.text
                                      .trim(),
                                  'qualification': qualificationCtrl.text
                                      .trim(),
                                  'experience': experienceCtrl.text.trim(),
                                }
                              : {
                                  'full_name': nameCtrl.text.trim(),
                                  'phone': phoneCtrl.text.trim(),
                                  'dob': dobCtrl.text.trim(),
                                  'gender': genderCtrl.text.trim(),
                                  'address': addressCtrl.text.trim(),
                                  'language_preference': langCtrl.text.trim(),
                                  'usn': usnCtrl.text.trim(),
                                  'student_id': usnCtrl.text.trim(),
                                  'course': courseCtrl.text.trim(),
                                  'section': sectionCtrl.text.trim(),
                                  'roll_number': rollNoCtrl.text.trim(),
                                  'parent_details': parentCtrl.text.trim(),
                                };
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            if (token.isNotEmpty) {
                              await ApiService.updateProfile(
                                updatedData,
                                token,
                              );
                            }
                            if (!mounted) return;
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Profile synced successfully!',
                                  style: GoogleFonts.inter(),
                                ),
                                backgroundColor: const Color(0xFF1A8F5E),
                              ),
                            );
                            _fetchProfile();
                          } catch (e) {
                            if (!mounted) return;
                            setState(() => _isLoading = false);
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(content: Text('Failed to update: $e')),
                            );
                          }
                        },
                        color: AppColors.gold,
                        glowColor: AppColors.gold.withValues(alpha: 0.3),
                        borderRadius: 16,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Text(
                          'SAVE CHANGES',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            color: Colors.black,
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModalTextField(
    String label,
    IconData icon,
    TextEditingController controller, {
    VoidCallback? onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextField(
      controller: controller,
      readOnly: onTap != null,
      onTap: onTap,
      style: TextStyle(color: isDark ? Colors.white : Colors.black87),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          color: isDark ? Colors.white38 : Colors.black45,
          fontSize: 13,
        ),
        prefixIcon: Icon(icon, color: AppColors.gold, size: 20),
        filled: true,
        fillColor: isDark
            ? Colors.white.withValues(alpha: 0.03)
            : Colors.black.withValues(alpha: 0.03),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: isDark ? Colors.white12 : Colors.black12,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.gold, width: 1),
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────
  //  AVATAR WIDGET — Clickable, drag-enabled, with upload HUD
  // ──────────────────────────────────────────────────────────────────
  Widget _buildAvatarSection(String initials) {
    final session = context.watch<SessionManager>();
    final String? networkAvatarUrl = (_profileData['profilePhotoUrl'] ??
            _profileData['avatar_url'] ??
            session.avatarUrl)
        ?.toString();
    final hasNetworkAvatar = networkAvatarUrl != null &&
        networkAvatarUrl.trim().isNotEmpty &&
        networkAvatarUrl != 'null';
    final hasLocalPreview = _localAvatarFile != null;

    ImageProvider? avatarImage;
    if (hasLocalPreview) {
      avatarImage = FileImage(_localAvatarFile!);
    } else if (hasNetworkAvatar) {
      final cleanUrl = networkAvatarUrl.replaceAll('\\', '/');
      final fullUrl = cleanUrl.startsWith('http')
          ? cleanUrl
          : cleanUrl.startsWith('/')
              ? '${ApiService.baseUrl}$cleanUrl'
              : '${ApiService.baseUrl}/$cleanUrl';
      avatarImage = CachedNetworkImageProvider(fullUrl);
    }

    return DragTarget<String>(
      onWillAcceptWithDetails: (_) {
        setState(() => _isDragOver = true);
        return true;
      },
      onLeave: (_) => setState(() => _isDragOver = false),
      onAcceptWithDetails: (_) {
        setState(() => _isDragOver = false);
        _pickImage(ImageSource.gallery);
      },
      builder: (context, candidateData, rejectedData) {
        return GestureDetector(
          onTap: _isUploading ? null : _showImageSourceSheet,
          child: AnimatedBuilder(
            animation: Listenable.merge([_scanController, _pulseController]),
            builder: (ctx, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  // Outer pulsing glow ring
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 148,
                    height: 148,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color:
                              (_isDragOver ? Colors.cyanAccent : AppColors.gold)
                                  .withValues(
                                    alpha: _isUploading
                                        ? 0.15 + 0.25 * _pulseController.value
                                        : (_isDragOver ? 0.4 : 0.2),
                                  ),
                          blurRadius: _isUploading ? 40 : 20,
                          spreadRadius: _isUploading ? 8 : 4,
                        ),
                      ],
                    ),
                  ),
                  // Gold border ring
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 144,
                    height: 144,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _isDragOver ? Colors.cyanAccent : AppColors.gold,
                        width: _isDragOver ? 3 : 2,
                      ),
                    ),
                  ),
                  // Rotating scan arc (only when uploading)
                  if (_isUploading)
                    SizedBox(
                      width: 144,
                      height: 144,
                      child: CustomPaint(
                        painter: _ScanArcPainter(_scanController.value),
                      ),
                    ),
                  // Avatar circle
                  CircleAvatar(
                    radius: 68,
                    backgroundColor: AppColors.bgModal,
                    backgroundImage: avatarImage,
                    onBackgroundImageError: avatarImage != null
                        ? (exception, stackTrace) {
                            debugPrint('Avatar image load error: $exception');
                          }
                        : null,
                    child: avatarImage == null
                        ? Text(
                            initials.isNotEmpty ? initials : 'AI',
                            style: GoogleFonts.inter(
                              fontSize: 34,
                              fontWeight: FontWeight.bold,
                              color: AppColors.gold,
                              letterSpacing: 1.5,
                            ),
                          )
                        : null,
                  ),
                  // Upload overlay
                  if (_isUploading)
                    Container(
                      width: 136,
                      height: 136,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.black.withValues(alpha: 0.55),
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
                                  _pulseController.value,
                                )!,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Uploading…',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  // Camera icon badge (bottom right)
                  if (!_isUploading)
                    Positioned(
                      bottom: 0,
                      right: 2,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isDragOver
                              ? Colors.cyanAccent
                              : AppColors.gold,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.gold.withValues(alpha: 0.4),
                              blurRadius: 10,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Icon(
                          _isDragOver
                              ? Icons.file_download_outlined
                              : Icons.camera_alt_rounded,
                          color: Colors.black,
                          size: 18,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final isTeacher =
        (_profileData['role'] ?? '').toString().toLowerCase() == 'teacher';
    final initials = (_profileData['full_name'] ?? 'U')
        .toString()
        .trim()
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDeep : AppColors.bgLight,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'My Profile',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios,
              color: isDark ? Colors.white : Colors.black87,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            if (!_isLoading)
              IconButton(
                onPressed: _showEditProfileSheet,
                icon: const Icon(Icons.edit_outlined, color: AppColors.gold),
              ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 10.0,
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 10),

                    // ── Avatar Upload Section ──────────────────────────
                    _buildAvatarSection(
                      initials,
                    ).animate().fadeIn(duration: 400.ms).scale(delay: 100.ms),

                    const SizedBox(height: 10),

                    // Hint text
                    AnimatedOpacity(
                      opacity: _isUploading ? 0 : 1,
                      duration: const Duration(milliseconds: 300),
                      child: Text(
                        'Tap or drag an image to update photo',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: isDark ? Colors.white30 : Colors.black38,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ── Name & Department ─────────────────────────────
                    Text(
                      _profileData['full_name'] ?? 'User',
                      style: GoogleFonts.inter(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

                    const SizedBox(height: 5),
                    Text(
                      isTeacher
                          ? '${_profileData['designation'] ?? 'Faculty'} • ${_profileData['specialization'] ?? 'Academic'}'
                          : (_profileData['course'] != null
                                ? '${_profileData['course']} • Section ${_profileData['section'] ?? 'A'}'
                                : (_profileData['department'] != null &&
                                          _profileData['college'] != null
                                      ? '${_profileData['department']} • ${_profileData['college']}'
                                      : 'SmartFace Academic Student')),
                      style: GoogleFonts.inter(
                        color: isDark ? Colors.white54 : Colors.black54,
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 300.ms),

                    const SizedBox(height: 24),

                    // ── Quick Stats Row ──────────────────────────────────────
                    Row(
                      children: [
                        Expanded(
                          child: MetricCard(
                            label: isTeacher ? 'Classes' : 'Active Sessions',
                            value: isTeacher ? '48' : '3',
                            icon: isTeacher
                                ? Icons.class_rounded
                                : Icons.devices_rounded,
                            accentColor: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: MetricCard(
                            label: isTeacher ? 'Enrolled' : 'System Health',
                            value: isTeacher ? '120' : '99.9%',
                            icon: isTeacher
                                ? Icons.people_alt_rounded
                                : Icons.speed_rounded,
                            accentColor: AppColors.gold,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: MetricCard(
                            label: isTeacher ? 'Avg Attendance' : 'Diagnostics',
                            value: isTeacher ? '89.6%' : 'Optimal',
                            icon: isTeacher
                                ? Icons.analytics_rounded
                                : Icons.insights_rounded,
                            accentColor: AppColors.cyan,
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),

                    const SizedBox(height: 35),

                    // ── Profile Fields ────────────────────────────────
                    if (isTeacher) ...[
                      _buildProfileCard(
                        Icons.badge_outlined,
                        'Employee ID',
                        _profileData['employee_id'] ?? 'N/A',
                        1,
                      ),
                      _buildProfileCard(
                        Icons.email_outlined,
                        'Institutional Email',
                        _profileData['email'] ?? 'N/A',
                        2,
                      ),
                      _buildProfileCard(
                        Icons.phone_outlined,
                        'Phone Number',
                        _profileData['phone'] ?? 'N/A',
                        3,
                      ),
                      _buildProfileCard(
                        Icons.work_outline,
                        'Designation',
                        _profileData['designation'] ?? 'N/A',
                        4,
                      ),
                      _buildProfileCard(
                        Icons.menu_book_outlined,
                        'Subject Specialization',
                        _profileData['specialization'] ?? 'N/A',
                        5,
                      ),
                      _buildProfileCard(
                        Icons.school_outlined,
                        'Qualification',
                        _profileData['qualification'] ?? 'N/A',
                        6,
                      ),
                      _buildProfileCard(
                        Icons.timeline_outlined,
                        'Years of Experience',
                        _profileData['experience'] ?? 'N/A',
                        7,
                      ),
                      _buildProfileCard(
                        Icons.wc_outlined,
                        'Gender',
                        _profileData['gender'] ?? 'N/A',
                        8,
                      ),
                      _buildProfileCard(
                        Icons.calendar_today_outlined,
                        'Date of Birth',
                        _profileData['dob'] ?? 'N/A',
                        9,
                      ),
                      _buildProfileCard(
                        Icons.home_outlined,
                        'Address',
                        _profileData['address'] ?? 'N/A',
                        10,
                      ),
                      _buildProfileCard(
                        Icons.language_outlined,
                        'Language Preference',
                        _profileData['language_preference'] ?? 'English',
                        11,
                      ),
                    ] else ...[
                      _buildProfileCard(
                        Icons.badge_outlined,
                        'Student ID / USN',
                        _profileData['usn'] ??
                            _profileData['student_id'] ??
                            'N/A',
                        1,
                      ),
                      _buildProfileCard(
                        Icons.email_outlined,
                        'Institutional Email',
                        _profileData['email'] ?? 'N/A',
                        2,
                      ),
                      _buildProfileCard(
                        Icons.phone_outlined,
                        'Phone Number',
                        _profileData['phone'] ?? 'N/A',
                        3,
                      ),
                      _buildProfileCard(
                        Icons.school_outlined,
                        'Class / Course',
                        _profileData['course'] ??
                            _profileData['college'] ??
                            'N/A',
                        4,
                      ),
                      _buildProfileCard(
                        Icons.grid_view_outlined,
                        'Section',
                        _profileData['section'] ??
                            _profileData['department'] ??
                            'N/A',
                        5,
                      ),
                      _buildProfileCard(
                        Icons.format_list_numbered_outlined,
                        'Roll Number',
                        _profileData['roll_number'] ??
                            _profileData['semester'] ??
                            'N/A',
                        6,
                      ),
                      _buildProfileCard(
                        Icons.wc_outlined,
                        'Gender',
                        _profileData['gender'] ?? 'N/A',
                        7,
                      ),
                      _buildProfileCard(
                        Icons.calendar_today_outlined,
                        'Date of Birth',
                        _profileData['dob'] ?? 'N/A',
                        8,
                      ),
                      _buildProfileCard(
                        Icons.home_outlined,
                        'Address',
                        _profileData['address'] ?? 'N/A',
                        9,
                      ),
                      _buildProfileCard(
                        Icons.family_restroom_outlined,
                        'Parent / Guardian Details',
                        _profileData['parent_details'] ?? 'N/A',
                        10,
                      ),
                      _buildProfileCard(
                        Icons.language_outlined,
                        'Language Preference',
                        _profileData['language_preference'] ?? 'English',
                        11,
                      ),
                    ],

                    const SizedBox(height: 24),

                    // ── Security & Biometrics ─────────────────────────
                    Padding(
                      padding: const EdgeInsets.only(bottom: 15),
                      child: GlassContainer(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 18,
                        ),
                        borderColor: Colors.white.withValues(alpha: 0.05),
                        borderRadius: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.blueAccent.withValues(
                                      alpha: 0.08,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.shield_outlined,
                                    color: Colors.blueAccent,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 18),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'SECURITY & BIOMETRICS',
                                        style: GoogleFonts.inter(
                                          color: Colors.white38,
                                          fontSize: 10,
                                          letterSpacing: 1,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        (_profileData['biometric_registered'] ??
                                                false)
                                            ? 'Biometric ID Active ✓'
                                            : 'Biometric ID Inactive ⚠',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 15),
                            Row(
                              children: [
                                Expanded(
                                  child: GlowButton(
                                    onPressed: () async {
                                      final session = context
                                          .read<SessionManager>();
                                      final args =
                                          ModalRoute.of(
                                                context,
                                              )?.settings.arguments
                                              as Map?;
                                      final token =
                                          args?['token'] ?? session.token ?? '';
                                      final email =
                                          args?['email'] ?? session.email ?? '';
                                      if (token.isEmpty) {
                                        _showSuccessSnack(
                                          'Demo Mode: Face registered successfully.',
                                        );
                                        return;
                                      }
                                      setState(() => _isLoading = true);
                                      try {
                                        await ApiService.registerBiometric(
                                          email,
                                          token,
                                        );
                                        if (!mounted) return;
                                        _showSuccessSnack(
                                          'Biometrics synced successfully!',
                                        );
                                        _fetchProfile();
                                      } catch (e) {
                                        if (!mounted) return;
                                        setState(() => _isLoading = false);
                                        _showErrorSnack(
                                          'Failed to register biometrics: $e',
                                        );
                                      }
                                    },
                                    color: AppColors.gold,
                                    glowColor: AppColors.gold.withValues(
                                      alpha: 0.3,
                                    ),
                                    borderRadius: 12,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.face_unlock_outlined,
                                          size: 16,
                                          color: Colors.black,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          (_profileData['biometric_registered'] ??
                                                  false)
                                              ? 'RE-REGISTER FACE'
                                              : 'REGISTER FACE',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: Colors.black,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 750.ms).slideX(begin: 0.05),

                    // ── App Customization ─────────────────────────────
                    Padding(
                      padding: const EdgeInsets.only(bottom: 15),
                      child: GlassContainer(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        borderColor: Colors.white.withValues(alpha: 0.05),
                        borderRadius: 20,
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isDark
                                    ? Icons.dark_mode_outlined
                                    : Icons.light_mode_outlined,
                                color: AppColors.gold,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 18),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'THEME SYSTEM',
                                    style: GoogleFonts.inter(
                                      color: Colors.white38,
                                      fontSize: 10,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    isDark
                                        ? 'Dark Mode Active'
                                        : 'Light Mode Active',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: isDark,
                              activeTrackColor: AppColors.gold,
                              activeThumbColor: Colors.black,
                              onChanged: (_) => themeCtrl.toggle(),
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 800.ms).slideX(begin: 0.05),

                    // ── App About ─────────────────────────────
                    Padding(
                      padding: const EdgeInsets.only(bottom: 15),
                      child: GlassContainer(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        borderColor: Colors.white.withValues(alpha: 0.05),
                        borderRadius: 20,
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
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.cyan.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.info_outline_rounded,
                                color: AppColors.cyan,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 18),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'ABOUT SMARTFACE',
                                    style: GoogleFonts.inter(
                                      color: Colors.white38,
                                      fontSize: 10,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'SmartFace AI Attendance',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: Colors.white38,
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 850.ms).slideX(begin: 0.05),

                    const SizedBox(height: 16),

                    // ── Logout ────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: GlowButton(
                        onPressed: () async {
                          final confirmed = await PremiumDialogs.showConfirmDialog(
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
                    ).animate().fadeIn(delay: 700.ms),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildProfileCard(
    IconData icon,
    String label,
    String value,
    int index,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      borderColor: Colors.white.withValues(alpha: 0.05),
      borderRadius: 20,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.gold, size: 22),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: GoogleFonts.inter(
                    color: isDark ? Colors.white38 : Colors.black45,
                    fontSize: 10,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.05);
  }
}

// ──────────────────────────────────────────────────────────────────
//  Custom painter: rotating cyan scan arc for upload HUD
// ──────────────────────────────────────────────────────────────────
class _ScanArcPainter extends CustomPainter {
  final double progress;
  _ScanArcPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 3;
    final startAngle = 2 * pi * progress - pi / 2;
    const sweepAngle = pi * 0.6; // 108° arc

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        colors: const [Colors.transparent, Colors.cyanAccent],
        startAngle: 0,
        endAngle: sweepAngle,
        transform: GradientRotation(startAngle),
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_ScanArcPainter old) => old.progress != progress;
}
