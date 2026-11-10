import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/design_system/ui/premium_background.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/dashboard_widgets.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

class ManagementDashboardScreen extends StatefulWidget {
  const ManagementDashboardScreen({super.key});

  @override
  State<ManagementDashboardScreen> createState() =>
      _ManagementDashboardScreenState();
}

class _ManagementDashboardScreenState extends State<ManagementDashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _summary = {};
  Map<String, dynamic> _health = {};
  Map<String, dynamic> _risk = {};

  bool get _isDepartmentRole =>
      context.read<SessionManager>().userRole == UserRole.hod;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final token = context.read<SessionManager>().token;
      if (token == null || token.isEmpty) {
        throw StateError('Your session has expired. Please sign in again.');
      }

      final departmentScoped = _isDepartmentRole;
      final results = await Future.wait([
        ApiService.getManagementSummary(token, isDepartment: departmentScoped),
        ApiService.getManagementCriticalRisk(token),
        if (!departmentScoped) ApiService.getManagementHealthScore(token),
      ]);

      if (!mounted) return;
      setState(() {
        _summary = Map<String, dynamic>.from(results[0] as Map);
        _risk = Map<String, dynamic>.from(results[1] as Map);
        _health = departmentScoped
            ? <String, dynamic>{}
            : Map<String, dynamic>.from(results[2] as Map);
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is StateError
            ? error.message.toString()
            : 'Management data is unavailable. Check your connection and retry.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final role = context.watch<SessionManager>().userRole;
    final departmentScoped = role == UserRole.hod;
    final title = departmentScoped
        ? 'Department overview'
        : 'Institution overview';
    final metrics = _metrics(departmentScoped);
    final attendanceRows =
        (departmentScoped
                ? _asMaps(_summary['daily_trend'])
                : _asMaps(_summary['monthly_growth']))
            .where((row) => _asDouble(row['total']) > 0)
            .toList();
    final departmentRows = _departmentRows();
    final atRisk = [
      ..._asMaps(_risk['below_60']),
      ..._asMaps(_risk['below_75']),
    ];

    return PremiumBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              Text(
                role.label,
                style: TextStyle(
                  color: AppColors.muted(brightness),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Refresh management data',
              onPressed: _loading ? null : _load,
              icon: const Icon(Icons.refresh_rounded),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: _loading
            ? const SafeArea(child: ManagementDashboardShimmer())
            : _error != null
            ? _buildError(brightness)
            : RefreshIndicator(
                onRefresh: _load,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final maxWidth = constraints.maxWidth;
                    final columns = maxWidth >= 1050
                        ? 4
                        : maxWidth >= 620
                        ? 2
                        : 1;
                    final contentWidth = (maxWidth - 32)
                        .clamp(0.0, 1380.0)
                        .toDouble();
                    const gap = 12.0;
                    final cardWidth =
                        (contentWidth - gap * (columns - 1)) / columns;

                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                      children: [
                        Center(
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: contentWidth),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  spacing: gap,
                                  runSpacing: gap,
                                  children: metrics
                                      .map(
                                        (metric) => SizedBox(
                                          width: cardWidth,
                                          child: StatCard(
                                            label: metric.$1,
                                            value: metric.$2,
                                            icon: metric.$3,
                                            accentColor: metric.$4,
                                          ),
                                        ),
                                      )
                                      .toList(),
                                ),
                                const SizedBox(height: 24),
                                if (!departmentScoped &&
                                    _health['health_score'] != null)
                                  _HealthScoreCard(
                                    score: _health['health_score'],
                                    breakdown: _asMap(_health['breakdown']),
                                  ),
                                const SizedBox(height: 20),
                                _buildAnalyticsRow(
                                  context,
                                  attendanceRows,
                                  departmentRows,
                                  maxWidth >= 900,
                                ),
                                const SizedBox(height: 20),
                                _buildRiskPanel(brightness, atRisk),
                                const SizedBox(height: 20),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: FilledButton.icon(
                                    onPressed: () => context.push(
                                      AppRoutes.analyticsDashboardPath,
                                    ),
                                    icon: const Icon(Icons.analytics_outlined),
                                    label: const Text('Open full analytics'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
      ),
    );
  }

  List<(String, String, IconData, Color)> _metrics(bool departmentScoped) {
    if (departmentScoped) {
      final faculty = _asMaps(_summary['faculty_sessions']);
      return [
        (
          'Attendance rate',
          _percent(_summary['attendance_rate']),
          Icons.fact_check_outlined,
          AppColors.primary,
        ),
        (
          'Active classes',
          _displayNumber(_summary['active_classes']),
          Icons.co_present_outlined,
          AppColors.accent,
        ),
        (
          'Students at risk',
          _displayNumber(_summary['at_risk_count']),
          Icons.warning_amber_rounded,
          AppColors.warning,
        ),
        (
          'Faculty tracked',
          faculty.length.toString(),
          Icons.groups_2_outlined,
          AppColors.success,
        ),
      ];
    }

    return [
      (
        'Students',
        _displayNumber(_summary['total_students']),
        Icons.school_outlined,
        AppColors.primary,
      ),
      (
        'Faculty',
        _displayNumber(_summary['total_faculty']),
        Icons.groups_2_outlined,
        AppColors.accent,
      ),
      (
        'Active classes',
        _displayNumber(_summary['active_classes']),
        Icons.co_present_outlined,
        AppColors.success,
      ),
      (
        'Attendance today',
        _percent(_summary['institution_attendance']),
        Icons.fact_check_outlined,
        AppColors.warning,
      ),
    ];
  }

  Widget _buildAnalyticsRow(
    BuildContext context,
    List<Map<String, dynamic>> attendanceRows,
    List<(String, dynamic)> departmentRows,
    bool sideBySide,
  ) {
    final trend = _DataPanel(
      title: _isDepartmentRole ? 'Weekly attendance' : 'Attendance trend',
      emptyText: 'No attendance history is available yet.',
      child: attendanceRows.isEmpty
          ? null
          : Column(
              children: attendanceRows.take(7).map((row) {
                final label = (row['day'] ?? row['month'] ?? 'Period')
                    .toString();
                return _ProgressRow(
                  label: label,
                  value: _asDouble(row['rate']),
                );
              }).toList(),
            ),
    );

    final departments = _DataPanel(
      title: _isDepartmentRole
          ? 'Faculty session compliance'
          : 'Department attendance',
      emptyText: 'No department metrics are available yet.',
      child: departmentRows.isEmpty
          ? null
          : Column(
              children: departmentRows.take(6).map((row) {
                return _ProgressRow(label: row.$1, value: _asDouble(row.$2));
              }).toList(),
            ),
    );

    if (!sideBySide) {
      return Column(children: [trend, const SizedBox(height: 14), departments]);
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: trend),
        const SizedBox(width: 14),
        Expanded(child: departments),
      ],
    );
  }

  List<(String, dynamic)> _departmentRows() {
    if (_isDepartmentRole) {
      return _asMaps(_summary['faculty_sessions'])
          .where((row) => row['compliance'] is num)
          .map(
            (row) => ((row['name'] ?? 'Faculty').toString(), row['compliance']),
          )
          .toList();
    }

    final comparison = _asMap(_summary['department_comparison']);
    if (comparison.isNotEmpty) {
      return comparison.entries
          .map((entry) => (entry.key, entry.value))
          .toList();
    }

    return _asMaps(_health['department_rankings'])
        .map(
          (row) =>
              ((row['department'] ?? 'Department').toString(), row['rate']),
        )
        .toList();
  }

  Widget _buildRiskPanel(
    Brightness brightness,
    List<Map<String, dynamic>> atRisk,
  ) {
    final longAbsences = _asMaps(_risk['long_absences']);
    return _DataPanel(
      title: 'Students needing follow-up',
      emptyText: 'No critical attendance risks are reported.',
      child: atRisk.isEmpty && longAbsences.isEmpty
          ? null
          : Column(
              children: [
                for (final student in atRisk.take(8))
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: AppColors.error.withValues(alpha: 0.12),
                      child: const Icon(
                        Icons.person_outline,
                        color: AppColors.error,
                      ),
                    ),
                    title: Text(
                      (student['name'] ?? student['student_id'] ?? 'Student')
                          .toString(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.heading(brightness),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      '${_percent(student['attendance'])} attendance · ${(student['risk'] ?? 'Review').toString()}',
                      style: TextStyle(color: AppColors.muted(brightness)),
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded),
                  ),
                if (longAbsences.isNotEmpty)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '${longAbsences.length} additional long absence alerts',
                      style: TextStyle(
                        color: AppColors.muted(brightness),
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildError(Brightness brightness) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_outlined,
              size: 42,
              color: AppColors.muted(brightness),
            ),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DataPanel extends StatelessWidget {
  const _DataPanel({
    required this.title,
    required this.emptyText,
    required this.child,
  });

  final String title;
  final String emptyText;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return ModernDashboardCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title),
          const SizedBox(height: 12),
          child ??
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 18),
                child: Center(
                  child: Text(
                    emptyText,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted(brightness)),
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class _HealthScoreCard extends StatelessWidget {
  const _HealthScoreCard({required this.score, required this.breakdown});

  final dynamic score;
  final Map<String, dynamic> breakdown;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return ModernDashboardCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            height: 72,
            child: CircularProgressIndicator(
              value: (_asDouble(score) / 100).clamp(0.0, 1.0).toDouble(),
              strokeWidth: 7,
              backgroundColor: AppColors.muted(
                brightness,
              ).withValues(alpha: 0.15),
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(title: 'Institution health'),
                Text(
                  '${_percent(score)} overall',
                  style: TextStyle(color: AppColors.muted(brightness)),
                ),
                if (breakdown.isNotEmpty)
                  Text(
                    breakdown.entries
                        .map(
                          (entry) =>
                              '${entry.key.replaceAll('_', ' ')} ${_percent(_asMap(entry.value)['score'])}',
                        )
                        .join('  ·  '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.muted(brightness),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final normalized = (value / 100).clamp(0.0, 1.0).toDouble();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.heading(brightness),
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                _percent(value),
                style: TextStyle(
                  color: AppColors.muted(brightness),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: normalized,
            minHeight: 6,
            borderRadius: BorderRadius.circular(8),
            backgroundColor: AppColors.muted(
              brightness,
            ).withValues(alpha: 0.12),
          ),
        ],
      ),
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

List<Map<String, dynamic>> _asMaps(dynamic value) => value is List
    ? value.whereType<Map>().map(Map<String, dynamic>.from).toList()
    : <Map<String, dynamic>>[];

double _asDouble(dynamic value) => value is num
    ? value.toDouble()
    : double.tryParse(value?.toString() ?? '') ?? 0;

String _percent(dynamic value) =>
    value is num ? '${value.toStringAsFixed(1)}%' : '—';

String _displayNumber(dynamic value) => value == null ? '—' : value.toString();
