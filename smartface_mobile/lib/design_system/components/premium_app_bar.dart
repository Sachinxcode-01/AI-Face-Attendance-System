import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  const PremiumAppBar({super.key, required this.title, this.actions});

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      title: Row(
        children: [
          SvgPicture.asset('assets/logos/logo.svg', width: 44, height: 44),
          const SizedBox(width: 12),
          Text(
            title,
            style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: Theme.of(context).textTheme.titleLarge?.color),
          ),
        ],
      ),
      actions: actions,
    );
  }
}
