import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final double? leadingWidth;
  final Widget? titleWidget;
  final bool centerTitle;
  final double elevation;
  final Color? backgroundColor;
  const PremiumAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.leadingWidth,
    this.titleWidget,
    this.centerTitle = false,
    this.elevation = 0.0,
    this.backgroundColor,
  });

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor ?? Colors.transparent,
      elevation: elevation,
      centerTitle: centerTitle,
      leading: leading,
      leadingWidth: leadingWidth,
      title:
          titleWidget ??
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) => const Icon(
                    Icons.face_retouching_natural,
                    size: 36,
                    color: Color(0xFF3D4AB8),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: GoogleFonts.playfairDisplay(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
            ],
          ),
      actions: actions,
    );
  }
}
