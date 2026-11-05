/*
|--------------------------------------------------------------------------
| File: college_search_picker.dart
|--------------------------------------------------------------------------
| Project: SmartFace Attendance
|
| Purpose:
| Searchable College / Institution picker integrated with College DB API.
| Provides real-time debounced institution search, state/city badges, and
| graceful custom-name fallback.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/design_system/ui/app_colors.dart';

class CollegeSearchPicker extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData prefixIcon;
  final ValueChanged<String>? onChanged;
  final ValueChanged<Map<String, dynamic>>? onCollegeSelected;
  final bool isDark;

  const CollegeSearchPicker({
    super.key,
    required this.controller,
    this.label = 'College / University',
    this.hint = 'Search or select your institution',
    this.prefixIcon = Icons.account_balance_outlined,
    this.onChanged,
    this.onCollegeSelected,
    this.isDark = false,
  });

  void _openSearchSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CollegeSearchModal(
        initialValue: controller.text,
        onSelected: (college) {
          final name = college['name']?.toString() ?? '';
          controller.text = name;
          onChanged?.call(name);
          onCollegeSelected?.call(college);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dark = isDark || Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: dark ? Colors.white70 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () => _openSearchSheet(context),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: dark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: dark ? Colors.white12 : const Color(0xFFE2E8F0),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  prefixIcon,
                  size: 20,
                  color: dark ? AppColors.goldLight : AppColors.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    controller.text.isNotEmpty ? controller.text : hint,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: controller.text.isNotEmpty ? FontWeight.w500 : FontWeight.w400,
                      color: controller.text.isNotEmpty
                          ? (dark ? Colors.white : const Color(0xFF0F172A))
                          : (dark ? Colors.white38 : const Color(0xFF94A3B8)),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  Icons.arrow_drop_down_rounded,
                  color: dark ? Colors.white54 : const Color(0xFF64748B),
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CollegeSearchModal extends StatefulWidget {
  final String initialValue;
  final ValueChanged<Map<String, dynamic>> onSelected;

  const _CollegeSearchModal({
    required this.initialValue,
    required this.onSelected,
  });

  @override
  State<_CollegeSearchModal> createState() => _CollegeSearchModalState();
}

class _CollegeSearchModalState extends State<_CollegeSearchModal> {
  final TextEditingController _queryController = TextEditingController();
  Timer? _debounce;
  bool _isLoading = false;
  List<Map<String, dynamic>> _results = [];
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialValue.isNotEmpty) {
      _queryController.text = widget.initialValue;
      _performSearch(widget.initialValue);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _queryController.dispose();
    super.dispose();
  }

  void _onQueryChanged(String query) {
    _debounce?.cancel();
    if (query.trim().length < 2) {
      setState(() {
        _results = [];
        _isLoading = false;
        _hasSearched = false;
      });
      return;
    }

    setState(() => _isLoading = true);
    _debounce = Timer(const Duration(milliseconds: 320), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    try {
      final list = await ApiService.searchColleges(query);
      if (mounted) {
        setState(() {
          _results = list;
          _isLoading = false;
          _hasSearched = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasSearched = true;
        });
      }
    }
  }

  void _selectCustomName(String name) {
    if (name.trim().isEmpty) return;
    widget.onSelected({
      'name': name.trim(),
      'city': '',
      'state': '',
      'type': 'Custom Institution',
    });
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: dark ? const Color(0xFF111827) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 30,
            offset: Offset(0, -8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: dark ? Colors.white24 : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Title Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (dark ? AppColors.gold : AppColors.primary).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.school_rounded,
                  size: 20,
                  color: dark ? AppColors.gold : AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Select Institution',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: dark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Powered by College DB · 50,000+ Indian Institutions',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: dark ? Colors.white54 : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  Icons.close_rounded,
                  color: dark ? Colors.white60 : const Color(0xFF64748B),
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Search Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: dark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: dark ? Colors.white12 : const Color(0xFFCBD5E1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.search_rounded,
                  color: dark ? Colors.white54 : const Color(0xFF64748B),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _queryController,
                    autofocus: true,
                    onChanged: _onQueryChanged,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: dark ? Colors.white : const Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search college, university, or institute...',
                      hintStyle: GoogleFonts.poppins(
                        fontSize: 13,
                        color: dark ? Colors.white38 : const Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                if (_queryController.text.isNotEmpty)
                  IconButton(
                    icon: Icon(
                      Icons.clear_rounded,
                      size: 18,
                      color: dark ? Colors.white54 : const Color(0xFF64748B),
                    ),
                    onPressed: () {
                      _queryController.clear();
                      _onQueryChanged('');
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Status & Results list
          Expanded(
            child: _isLoading
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              dark ? AppColors.gold : AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Searching College DB...',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: dark ? Colors.white54 : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  )
                : _results.isNotEmpty
                    ? ListView.separated(
                        itemCount: _results.length,
                        separatorBuilder: (_, _) => Divider(
                          height: 1,
                          color: dark ? Colors.white10 : const Color(0xFFF1F5F9),
                        ),
                        itemBuilder: (ctx, idx) {
                          final item = _results[idx];
                          final name = item['name']?.toString() ?? '';
                          final city = item['city']?.toString() ?? '';
                          final state = item['state']?.toString() ?? '';
                          final type = item['type']?.toString() ?? 'College';
                          final location = [city, state].where((s) => s.isNotEmpty).join(', ');

                          return InkWell(
                            onTap: () {
                              widget.onSelected(item);
                              Navigator.of(context).pop();
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 2),
                                    padding: const EdgeInsets.all(7),
                                    decoration: BoxDecoration(
                                      color: (dark ? AppColors.gold : AppColors.primary).withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.account_balance_rounded,
                                      size: 16,
                                      color: dark ? AppColors.goldLight : AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          name,
                                          style: GoogleFonts.poppins(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: dark ? Colors.white : const Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            if (location.isNotEmpty) ...[
                                              Icon(
                                                Icons.location_on_outlined,
                                                size: 12,
                                                color: dark ? Colors.white54 : const Color(0xFF64748B),
                                              ),
                                              const SizedBox(width: 3),
                                              Text(
                                                location,
                                                style: GoogleFonts.poppins(
                                                  fontSize: 11,
                                                  color: dark ? Colors.white60 : const Color(0xFF64748B),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                            ],
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                              decoration: BoxDecoration(
                                                color: dark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                type,
                                                style: GoogleFonts.poppins(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w500,
                                                  color: dark ? Colors.white70 : const Color(0xFF475569),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    Icons.chevron_right_rounded,
                                    size: 20,
                                    color: dark ? Colors.white30 : const Color(0xFFCBD5E1),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      )
                    : Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _hasSearched ? Icons.search_off_rounded : Icons.school_outlined,
                                size: 44,
                                color: dark ? Colors.white24 : const Color(0xFFCBD5E1),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _hasSearched
                                    ? 'No institutions found for "${_queryController.text}"'
                                    : 'Type at least 2 characters to search Indian colleges & universities',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 13,
                                  color: dark ? Colors.white60 : const Color(0xFF64748B),
                                ),
                              ),
                              if (_hasSearched && _queryController.text.trim().isNotEmpty) ...[
                                const SizedBox(height: 16),
                                OutlinedButton.icon(
                                  onPressed: () => _selectCustomName(_queryController.text),
                                  icon: const Icon(Icons.add_rounded, size: 18),
                                  label: Text(
                                    'Use "${_queryController.text.trim()}"',
                                    style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: dark ? AppColors.gold : AppColors.primary,
                                    side: BorderSide(
                                      color: (dark ? AppColors.gold : AppColors.primary).withValues(alpha: 0.5),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
          ),

          // Custom Input Footer
          Container(
            padding: const EdgeInsets.only(top: 10),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: dark ? Colors.white10 : const Color(0xFFE2E8F0),
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Cannot find your institution?',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: dark ? Colors.white54 : const Color(0xFF64748B),
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    _showManualEntryDialog(context);
                  },
                  child: Text(
                    'Enter Manually',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: dark ? AppColors.goldLight : AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showManualEntryDialog(BuildContext parentContext) {
    final customCtrl = TextEditingController(text: _queryController.text);
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: Text(
          'Enter Institution Name',
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        content: TextField(
          controller: customCtrl,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'e.g. Cambridge High School or ABC College',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = customCtrl.text.trim();
              if (text.isNotEmpty) {
                Navigator.of(dialogCtx).pop();
                _selectCustomName(text);
              }
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}
