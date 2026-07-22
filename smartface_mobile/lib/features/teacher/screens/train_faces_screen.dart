/*
|--------------------------------------------------------------------------
| File: train_faces_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the face registration and model retraining center for instructors.
| Instructors search for students, pick/capture their facial image, and trigger
| background retraining of the ONNX InsightFace neural engine to recalculate embeddings.
|
| Responsibilities:
| - Fetches lists of active students via ApiService.getStudents.
| - Renders an autocomplete search box for selecting a student profiles.
| - Employs ImagePicker to capture/pick high-quality portrait photos.
| - Uploads selected face captures via ApiService.uploadStudentFace.
| - Initiates background AI retraining jobs via ApiService.triggerTrainFaces.
|
| Dependencies:
| - package:flutter/material.dart
| - package:google_fonts/google_fonts.dart
| - package:image_picker/image_picker.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

// ======================================================
// Standard Library Imports
// ======================================================
import 'dart:io';

// ======================================================
// External Packages
// ======================================================
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core State & Constants
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// ======================================================
// Services Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen interface for faculty members to register student faces and trigger AI embedding retraining.
class TrainFacesScreen extends StatefulWidget {
  const TrainFacesScreen({super.key});

  @override
  State<TrainFacesScreen> createState() => _TrainFacesScreenState();
}

class _TrainFacesScreenState extends State<TrainFacesScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _imageFile;

  List<Map<String, dynamic>> _students = [];
  Map<String, dynamic>? _selectedStudent;
  bool _isLoadingStudents = true;
  bool _isUploading = false;
  bool _isTraining = false;
  final TextEditingController _autocompleteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchStudents();
    });
  }

  Future<void> _fetchStudents() async {
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? session.token ?? '';

    final list = await ApiService.getStudents(token);
    if (mounted) {
      setState(() {
        _students = list
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _isLoadingStudents = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? selected = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      if (selected != null && mounted) {
        setState(() {
          _imageFile = selected;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to grab image: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _uploadFace() async {
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a student first'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture or select a face photo'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isUploading = true);
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? session.token ?? '';

    final res = await ApiService.uploadStudentFace(
      _selectedStudent!['email'],
      File(_imageFile!.path),
      token,
    );

    if (mounted) {
      setState(() => _isUploading = false);
      if (res.containsKey('message')) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message']),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() {
          _imageFile = null;
          _selectedStudent = null;
          _autocompleteController.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['detail'] ?? 'Upload failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _startTraining() async {
    setState(() => _isTraining = true);
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? session.token ?? '';

    final res = await ApiService.triggerTrainFaces(token);

    if (mounted) {
      setState(() => _isTraining = false);
      if (res.containsKey('message')) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: AppColors.bgModal,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(
                color: AppColors.gold.withValues(alpha: 0.15),
                width: 1.5,
              ),
            ),
            title: const Row(
              children: [
                Icon(Icons.bolt_rounded, color: AppColors.gold, size: 28),
                SizedBox(width: 12),
                Text(
                  'AI TRAINING STARTED',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            content: const Text(
              'The face recognition neural network is now training in the background. It will recompile the student face embeddings automatically without blocking server routes.',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'DISMISS',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['detail'] ?? 'Failed to initiate training'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PremiumBackground(
      immersive: false,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Train AI Faces',
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: _isLoadingStudents
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ONBOARD STUDENT FACE',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        letterSpacing: 2,
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Search Autocomplete Card
                    _buildGlassCard(
                      child: Autocomplete<Map<String, dynamic>>(
                        displayStringForOption: (Map<String, dynamic> option) =>
                            "${option['full_name']} (${option['student_id']})",
                        optionsBuilder: (TextEditingValue textEditingValue) {
                          if (textEditingValue.text.isEmpty) {
                            return const Iterable<Map<String, dynamic>>.empty();
                          }
                          return _students.where((student) {
                            final name = student['full_name']
                                .toString()
                                .toLowerCase();
                            final id = student['student_id']
                                .toString()
                                .toLowerCase();
                            final search = textEditingValue.text.toLowerCase();
                            return name.contains(search) || id.contains(search);
                          });
                        },
                        onSelected: (Map<String, dynamic> selection) {
                          setState(() {
                            _selectedStudent = selection;
                          });
                        },
                        fieldViewBuilder:
                            (context, controller, focusNode, onFieldSubmitted) {
                              // Store the controller reference to clear it later
                              if (_autocompleteController.text.isEmpty &&
                                  controller.text.isNotEmpty) {
                                _autocompleteController.text = controller.text;
                              }
                              return TextField(
                                controller: controller,
                                focusNode: focusNode,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                                decoration: InputDecoration(
                                  labelText: 'Select Student',
                                  labelStyle: const TextStyle(
                                    color: Colors.white38,
                                    fontSize: 13,
                                  ),
                                  prefixIcon: const Icon(
                                    Icons.person_search_outlined,
                                    color: AppColors.gold,
                                    size: 20,
                                  ),
                                  suffixIcon: _selectedStudent != null
                                      ? const Icon(
                                          Icons.check_circle_outline,
                                          color: AppColors.success,
                                          size: 20,
                                        )
                                      : null,
                                  filled: true,
                                  fillColor: Colors.black.withValues(
                                    alpha: 0.15,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide.none,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                ),
                              );
                            },
                      ),
                    ),
                    const SizedBox(height: 25),

                    Text(
                      'CAPTURE BIOMETRIC SHIELD',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        letterSpacing: 2,
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Image Selection Zone
                    _buildGlassCard(
                      child: Column(
                        children: [
                          Center(
                            child: Container(
                              height: 220,
                              width: 220,
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: _imageFile != null
                                      ? AppColors.gold
                                      : Colors.white10,
                                  width: 1.5,
                                ),
                                image: _imageFile != null
                                    ? DecorationImage(
                                        image: FileImage(
                                          File(_imageFile!.path),
                                        ),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: _imageFile == null
                                  ? Icon(
                                      Icons.face_retouching_natural_outlined,
                                      size: 60,
                                      color: Colors.white.withValues(
                                        alpha: 0.15,
                                      ),
                                    )
                                  : null,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      _pickImage(ImageSource.camera),
                                  icon: const Icon(
                                    Icons.camera_alt_outlined,
                                    size: 18,
                                  ),
                                  label: const Text(
                                    'CAMERA',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white,
                                    side: const BorderSide(
                                      color: Colors.white12,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 15),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      _pickImage(ImageSource.gallery),
                                  icon: const Icon(
                                    Icons.photo_library_outlined,
                                    size: 18,
                                  ),
                                  label: const Text(
                                    'GALLERY',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white,
                                    side: const BorderSide(
                                      color: Colors.white12,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),

                    // Action Buttons
                    SizedBox(
                      width: double.infinity,
                      height: 58,
                      child: ElevatedButton.icon(
                        onPressed: (_isUploading || _isTraining)
                            ? null
                            : _uploadFace,
                        icon: _isUploading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.black,
                                ),
                              )
                            : const Icon(Icons.cloud_upload_outlined),
                        label: Text(
                          _isUploading ? 'UPLOADING...' : 'UPLOAD FACE PHOTO',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Train button
                    SizedBox(
                      width: double.infinity,
                      height: 58,
                      child: OutlinedButton.icon(
                        onPressed: (_isUploading || _isTraining)
                            ? null
                            : _startTraining,
                        icon: _isTraining
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.gold,
                                ),
                              )
                            : const Icon(Icons.bolt_rounded),
                        label: Text(
                          _isTraining
                              ? 'TRAINING...'
                              : 'RE-TRAIN NEURAL ENGINE',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.gold,
                          side: const BorderSide(
                            color: AppColors.gold,
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildGlassCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F152B).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.04),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
