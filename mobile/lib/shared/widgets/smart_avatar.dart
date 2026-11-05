/*
|--------------------------------------------------------------------------
| File: smart_avatar.dart
|--------------------------------------------------------------------------
| SmartFace Attendance — Professional Avatar & Persona System
| Displays vector preset avatars, network photos, or styled initials with
| role badges and interactive picker support.
|--------------------------------------------------------------------------
*/

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class AvatarPreset {
  final String id;
  final String title;
  final String assetPath;
  final String roleTag;
  final Color themeColor;

  const AvatarPreset({
    required this.id,
    required this.title,
    required this.assetPath,
    required this.roleTag,
    required this.themeColor,
  });
}

class AppAvatarPresets {
  static const List<AvatarPreset> presets = [
    AvatarPreset(
      id: 'avatar_student_boy',
      title: 'Scholar Boy',
      assetPath: 'assets/avatars/avatar_student_boy.svg',
      roleTag: 'Student',
      themeColor: Color(0xFF4F46E5),
    ),
    AvatarPreset(
      id: 'avatar_student_girl',
      title: 'Biotech Scholar',
      assetPath: 'assets/avatars/avatar_student_girl.svg',
      roleTag: 'Student',
      themeColor: Color(0xFFEC4899),
    ),
    AvatarPreset(
      id: 'avatar_tech',
      title: 'Cyber Specialist',
      assetPath: 'assets/avatars/avatar_tech.svg',
      roleTag: 'Tech / CS',
      themeColor: Color(0xFF06B6D4),
    ),
    AvatarPreset(
      id: 'avatar_graduate',
      title: 'Honors Graduate',
      assetPath: 'assets/avatars/avatar_graduate.svg',
      roleTag: 'Alumni / Senior',
      themeColor: Color(0xFF10B981),
    ),
    AvatarPreset(
      id: 'avatar_professor',
      title: 'Faculty / Dean',
      assetPath: 'assets/avatars/avatar_professor.svg',
      roleTag: 'Professor',
      themeColor: Color(0xFFD97706),
    ),
    AvatarPreset(
      id: 'avatar_ai',
      title: 'Nexa AI Bot',
      assetPath: 'assets/avatars/avatar_ai.svg',
      roleTag: 'Assistant',
      themeColor: Color(0xFF8B5CF6),
    ),
  ];

  static AvatarPreset? getById(String? id) {
    if (id == null) return null;
    try {
      return presets.firstWhere((p) => p.id == id || p.assetPath == id);
    } catch (_) {
      return null;
    }
  }
}

class SmartAvatar extends StatelessWidget {
  final String? avatarUrl;
  final File? localFile;
  final String initials;
  final double radius;
  final double borderWidth;
  final Color? borderColor;
  final VoidCallback? onTap;
  final bool showEditBadge;

  const SmartAvatar({
    super.key,
    this.avatarUrl,
    this.localFile,
    this.initials = 'ST',
    this.radius = 28,
    this.borderWidth = 2,
    this.borderColor,
    this.onTap,
    this.showEditBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    final size = radius * 2;
    final effectiveBorder = borderColor ?? const Color(0xFF6366F1);

    Widget innerImage;

    if (localFile != null && localFile!.existsSync()) {
      innerImage = Image.file(
        localFile!,
        width: size,
        height: size,
        fit: BoxFit.cover,
      );
    } else if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      final url = avatarUrl!;
      final preset = AppAvatarPresets.getById(url);

      if (preset != null || url.startsWith('assets/')) {
        final path = preset?.assetPath ?? url;
        innerImage = SvgPicture.asset(
          path,
          width: size,
          height: size,
          fit: BoxFit.cover,
        );
      } else if (url.startsWith('http')) {
        innerImage = CachedNetworkImage(
          imageUrl: url,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: const Color(0xFF1E293B),
            child: const Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ),
          errorWidget: (context, url, error) => _buildInitials(size),
        );
      } else {
        innerImage = _buildInitials(size);
      }
    } else {
      innerImage = _buildInitials(size);
    }

    Widget avatarCore = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: effectiveBorder, width: borderWidth),
        boxShadow: [
          BoxShadow(
            color: effectiveBorder.withValues(alpha: 0.3),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: ClipOval(child: innerImage),
    );

    if (!showEditBadge && onTap == null) {
      return avatarCore;
    }

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          avatarCore,
          if (showEditBadge)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: effectiveBorder,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(
                  Icons.palette_rounded,
                  size: 14,
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInitials(double size) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials.isNotEmpty ? initials : 'U',
        style: GoogleFonts.inter(
          fontSize: size * 0.38,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    );
  }
}

