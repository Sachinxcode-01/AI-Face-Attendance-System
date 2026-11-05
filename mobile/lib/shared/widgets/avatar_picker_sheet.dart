/*
|--------------------------------------------------------------------------
| File: avatar_picker_sheet.dart
|--------------------------------------------------------------------------
| SmartFace Attendance — Professional Avatar Selection Sheet
| Allows students and staff to choose from modern vector persona avatars
| or upload their custom profile photo.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'smart_avatar.dart';

class AvatarPickerBottomSheet extends StatefulWidget {
  final String? currentAvatar;
  final ValueChanged<String> onSelectPreset;
  final VoidCallback? onUploadCustom;

  const AvatarPickerBottomSheet({
    super.key,
    this.currentAvatar,
    required this.onSelectPreset,
    this.onUploadCustom,
  });

  static Future<String?> show(
    BuildContext context, {
    String? currentAvatar,
    VoidCallback? onUploadCustom,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AvatarPickerBottomSheet(
        currentAvatar: currentAvatar,
        onSelectPreset: (presetId) => Navigator.of(ctx).pop(presetId),
        onUploadCustom: () {
          Navigator.of(ctx).pop();
          onUploadCustom?.call();
        },
      ),
    );
  }

  @override
  State<AvatarPickerBottomSheet> createState() =>
      _AvatarPickerBottomSheetState();
}

class _AvatarPickerBottomSheetState extends State<AvatarPickerBottomSheet> {
  String? _selectedId;

  @override
  void initState() {
    super.initState();
    _selectedId = widget.currentAvatar;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF0F172A) : Colors.white;
    final textHeading = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? Colors.white70 : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Choose Avatar Persona',
                    style: GoogleFonts.poppins(
                      fontSize: 19,
                      fontWeight: FontWeight.w700,
                      color: textHeading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Select a 3D vector avatar for your campus profile',
                    style: GoogleFonts.inter(fontSize: 12.5, color: textSub),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.of(context).pop(),
                color: textSub,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Avatars grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: AppAvatarPresets.presets.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 0.88,
            ),
            itemBuilder: (context, index) {
              final preset = AppAvatarPresets.presets[index];
              final isSelected =
                  _selectedId == preset.id || _selectedId == preset.assetPath;

              return InkWell(
                onTap: () {
                  setState(() => _selectedId = preset.assetPath);
                  widget.onSelectPreset(preset.assetPath);
                },
                borderRadius: BorderRadius.circular(16),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? preset.themeColor.withValues(alpha: 0.15)
                        : (isDark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF8FAFC)),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected
                          ? preset.themeColor
                          : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      width: isSelected ? 2.5 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        children: [
                          SvgPicture.asset(
                            preset.assetPath,
                            width: 54,
                            height: 54,
                          ),
                          if (isSelected)
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: preset.themeColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check_rounded,
                                  size: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        preset.title,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w600,
                          color: isSelected ? preset.themeColor : textHeading,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        preset.roleTag,
                        style: GoogleFonts.inter(fontSize: 9.5, color: textSub),
                        maxLines: 1,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),

          // Custom photo option button
          if (widget.onUploadCustom != null) ...[
            OutlinedButton.icon(
              onPressed: widget.onUploadCustom,
              icon: const Icon(Icons.add_a_photo_rounded, size: 18),
              label: Text(
                'Upload Real Selfie / Photo',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 46),
                foregroundColor: const Color(0xFF6366F1),
                side: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
