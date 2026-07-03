/*
|--------------------------------------------------------------------------
| File: server_settings_screen.dart
|--------------------------------------------------------------------------
| Purpose:
| An enterprise-grade, Notion-style tabbed settings console for SmartFace AI.
| Displays parameters for Account (Sandbox roles & themes), Security (Session lock),
| Biometrics (AI thresholds & simulated neural training), System Gateway (IP/domain ping),
| and Trusted Devices.
| Supports responsive layouts (two-column split on tablet, horizontal swipe on mobile).
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class ServerSettingsScreen extends StatefulWidget {
  const ServerSettingsScreen({super.key});

  @override
  State<ServerSettingsScreen> createState() => _ServerSettingsScreenState();
}

class _ServerSettingsScreenState extends State<ServerSettingsScreen> {
  // Tab index: 0=Account, 1=Security, 2=Biometrics, 3=Gateway, 4=Devices
  int _activeTabIndex = 0;

  // Controllers
  final _hostController = TextEditingController();
  final _portController = TextEditingController();
  final _nameController = TextEditingController();
  final _avatarController = TextEditingController();

  // Gateway Connection Testing State
  bool _testingConnection = false;
  String _connectionStatus = 'UNTESTED'; // UNTESTED, ONLINE, OFFLINE

  // Biometrics & Security State (Persisted locally)
  double _faceMatchingThreshold = 0.80;
  double _livenessStrictness = 0.85;
  String _sessionTimeout = '15 mins';
  bool _biometricAppLock = false;
  bool _twoFactorAuth = false;

  // Simulated Face Retraining State
  bool _isRetraining = false;
  double _retrainingProgress = 0.0;
  String _retrainingStatusText = 'Initializing Enrollment...';

  // Mock Trusted Devices
  final List<Map<String, String>> _trustedDevices = [
    {
      'id': 'device-1',
      'name': 'Pixel 8 Pro (This Device)',
      'location': 'Mumbai, India',
      'lastActive': 'Active Now',
      'isCurrent': 'true',
    },
    {
      'id': 'device-2',
      'name': 'MacBook Pro M3 Max',
      'location': 'Mumbai, India',
      'lastActive': '2 hours ago',
      'isCurrent': 'false',
    },
    {
      'id': 'device-3',
      'name': 'iPad Air M2',
      'location': 'Delhi, India',
      'lastActive': '3 days ago',
      'isCurrent': 'false',
    },
  ];

  @override
  void initState() {
    super.initState();
    _hostController.text = ApiService.serverHost;
    _portController.text = ApiService.serverPort;

    final session = context.read<SessionManager>();
    _nameController.text = session.name ?? '';
    _avatarController.text = session.avatarUrl ?? '';

    _loadSettings();
  }

  @override
  void dispose() {
    _hostController.dispose();
    _portController.dispose();
    _nameController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  // Load from local SharedPreferences
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _faceMatchingThreshold =
          prefs.getDouble('sf_face_match_threshold') ?? 0.80;
      _livenessStrictness = prefs.getDouble('sf_liveness_strictness') ?? 0.85;
      _sessionTimeout = prefs.getString('sf_session_timeout') ?? '15 mins';
      _biometricAppLock = prefs.getBool('sf_biometric_app_lock') ?? false;
      _twoFactorAuth = prefs.getBool('sf_two_factor_auth') ?? false;
    });
  }

  // Save specific settings helper
  Future<void> _savePreference(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is double) {
      await prefs.setDouble(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    } else if (value is bool) {
      await prefs.setBool(key, value);
    }
  }

  // Test Gateway Connection Ping
  Future<void> _testPing() async {
    setState(() {
      _testingConnection = true;
      _connectionStatus = 'TESTING';
    });

    final originalHost = ApiService.serverHost;
    final originalPort = ApiService.serverPort;

    // Temporarily save to test
    await ApiService.saveServerSettings(
      _hostController.text.trim(),
      _portController.text.trim(),
    );

    final online = await ApiService.isServerOnline();

    // Revert settings until explicit save
    await ApiService.saveServerSettings(originalHost, originalPort);

    if (mounted) {
      setState(() {
        _testingConnection = false;
        _connectionStatus = online ? 'ONLINE' : 'OFFLINE';
      });

      AppToast.show(
        context,
        message: online
            ? 'Gateway Server Reachable!'
            : 'Gateway Connection Failed!',
        type: online ? ToastType.success : ToastType.error,
      );
    }
  }

  // Save Gateway configurations permanently
  Future<void> _saveGatewayConfig() async {
    if (_hostController.text.isEmpty || _portController.text.isEmpty) {
      AppToast.show(
        context,
        message: 'Host IP and Port cannot be empty.',
        type: ToastType.warning,
      );
      return;
    }

    await ApiService.saveServerSettings(
      _hostController.text.trim(),
      _portController.text.trim(),
    );

    if (mounted) {
      AppToast.show(
        context,
        message: 'Gateway connection endpoints saved & applied!',
        type: ToastType.success,
      );
    }
  }

  // Sandbox Role Switcher Action
  Future<void> _switchRoleSandbox(UserRole role) async {
    final session = context.read<SessionManager>();
    await session.saveSession(
      token: session.token ?? 'mock_sandbox_jwt_token',
      email: session.email ?? 'sachin.dev@university.edu',
      role: role.name,
      name: session.name ?? 'Sachin Dev',
      avatarUrl: session.avatarUrl,
      biometricRegistered: session.biometricRegistered,
    );

    if (mounted) {
      AppToast.show(
        context,
        message:
            'Sandbox Security Role changed to ${role.label}! Re-routing app...',
        type: ToastType.success,
      );
    }
  }

  // Update Profile parameters
  Future<void> _updateProfileIdentity() async {
    final session = context.read<SessionManager>();
    final newName = _nameController.text.trim();
    final newAvatar = _avatarController.text.trim();

    if (newName.isEmpty) {
      AppToast.show(
        context,
        message: 'Name cannot be empty',
        type: ToastType.warning,
      );
      return;
    }

    await session.updateName(newName);
    if (newAvatar.isNotEmpty) {
      await session.updateAvatarUrl(newAvatar);
    }

    if (mounted) {
      AppToast.show(
        context,
        message: 'Profile details updated successfully!',
        type: ToastType.success,
      );
    }
  }

  // Revoke device credentials
  void _revokeDevice(String deviceId, String deviceName) {
    setState(() {
      _trustedDevices.removeWhere((d) => d['id'] == deviceId);
    });
    AppToast.show(
      context,
      message: 'Access revoked for $deviceName',
      type: ToastType.warning,
    );
  }

  // Revoke all other sessions
  Future<void> _revokeAllSessions() async {
    final session = context.read<SessionManager>();
    if (session.token == null) return;

    setState(() {
      _trustedDevices.removeWhere((d) => d['isCurrent'] != 'true');
    });

    await ApiService.logoutAllSessions(session.token!);
    if (mounted) {
      AppToast.show(
        context,
        message: 'All other active sessions revoked successfully.',
        type: ToastType.success,
      );
    }
  }

  // Simulate Face Retraining Pipeline
  void _runFaceRetrainingSimulation() {
    setState(() {
      _isRetraining = true;
      _retrainingProgress = 0.0;
      _retrainingStatusText = 'Initializing Enrollment...';
    });

    final steps = [
      'Normalizing biometric frames...',
      'Extracting facial landmark clusters (68 landmarks)...',
      'Generating facial embeddings graph...',
      'Optimizing deep learning weights...',
      'Syncing parameters to SmartFace AI Cloud...',
      'Face ID Enrollment Complete!',
    ];

    int currentStep = 0;
    Timer.periodic(const Duration(milliseconds: 600), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      setState(() {
        _retrainingProgress = (timer.tick / steps.length).clamp(0.0, 1.0);
        if (currentStep < steps.length - 1) {
          _retrainingStatusText = steps[currentStep];
          currentStep++;
        } else {
          _retrainingStatusText = steps.last;
        }
      });

      if (timer.tick >= steps.length) {
        timer.cancel();
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            setState(() {
              _isRetraining = false;
            });
            AppToast.show(
              context,
              title: 'Enrollment Optimized ✨',
              message: 'Face ID neural templates compiled successfully!',
              type: ToastType.success,
            );
          }
        });
      }
    });
  }

  // ============================================================================
  // Tab Metadata Definitions
  // ============================================================================
  final List<Map<String, dynamic>> _tabsInfo = [
    {'label': 'Account', 'icon': Icons.person_outline_rounded},
    {'label': 'Security', 'icon': Icons.security_rounded},
    {'label': 'Biometrics', 'icon': Icons.fingerprint_rounded},
    {'label': 'Gateway', 'icon': Icons.dns_outlined},
    {'label': 'Devices', 'icon': Icons.devices_other_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final session = context.watch<SessionManager>();

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDeep : AppColors.bgLight,
      appBar: PremiumAppBar(
        title: 'System Configurations',
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
        backgroundColor: isDark ? AppColors.bgDeep : AppColors.bgLight,
      ),
      body: Stack(
        children: [
          // Background Gradient Mesh for Slate-Dark Mode
          if (isDark) _buildGlowMeshBackground(),

          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isTablet = constraints.maxWidth >= 600;
                if (isTablet) {
                  return _buildTabletLayout(session, themeCtrl, isDark);
                } else {
                  return _buildMobileLayout(session, themeCtrl, isDark);
                }
              },
            ),
          ),

          // High Fidelity Retraining Dialog Overlay
          if (_isRetraining) _buildRetrainingOverlay(),
        ],
      ),
    );
  }

  // ============================================================================
  // Layout Templates
  // ============================================================================

  // Tablet Two-Column Layout (Master Sidebar + Detail Pane)
  Widget _buildTabletLayout(
    SessionManager session,
    ThemeController themeCtrl,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Side: Vertical Sidebar
          SizedBox(
            width: 240,
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              borderColor: isDark
                  ? Colors.white.withValues(alpha: 0.05)
                  : Colors.black.withValues(alpha: 0.05),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(_tabsInfo.length, (index) {
                  final item = _tabsInfo[index];
                  final isSelected = _activeTabIndex == index;
                  return ListTile(
                    leading: Icon(
                      item['icon'],
                      color: isSelected
                          ? AppColors.gold
                          : (isDark ? Colors.white54 : Colors.black54),
                    ),
                    title: Text(
                      item['label'],
                      style: AppText.subheading(
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.white70 : Colors.black87),
                        weight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                    tileColor: isSelected
                        ? AppColors.gold.withValues(alpha: 0.12)
                        : Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _activeTabIndex = index;
                      });
                    },
                  );
                }),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          // Right Side: Active Settings Panel Content
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: _buildActiveTabContent(
                session,
                themeCtrl,
                isDark,
              ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.04, end: 0),
            ),
          ),
        ],
      ),
    );
  }

  // Mobile Swipeable Layout (Horizontal tabs on top + Detail scroll)
  Widget _buildMobileLayout(
    SessionManager session,
    ThemeController themeCtrl,
    bool isDark,
  ) {
    return Column(
      children: [
        // Horizontal Scrollable Tabs Selector
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: List.generate(_tabsInfo.length, (index) {
              final item = _tabsInfo[index];
              final isSelected = _activeTabIndex == index;
              return Container(
                margin: const EdgeInsets.only(right: AppSpacing.sm),
                child: ChoiceChip(
                  label: Row(
                    children: [
                      Icon(
                        item['icon'],
                        size: 16,
                        color: isSelected
                            ? Colors.black
                            : (isDark ? Colors.white70 : Colors.black87),
                      ),
                      const SizedBox(width: 6),
                      Text(item['label']),
                    ],
                  ),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _activeTabIndex = index;
                      });
                    }
                  },
                  selectedColor: AppColors.gold,
                  backgroundColor: isDark
                      ? Colors.white.withValues(alpha: 0.03)
                      : Colors.black.withValues(alpha: 0.03),
                  labelStyle: AppText.body(
                    color: isSelected
                        ? Colors.black
                        : (isDark ? Colors.white70 : Colors.black87),
                    weight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected
                          ? Colors.transparent
                          : (isDark
                                ? Colors.white.withValues(alpha: 0.08)
                                : Colors.black.withValues(alpha: 0.08)),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        // Settings panel contents
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            child: _buildActiveTabContent(
              session,
              themeCtrl,
              isDark,
            ).animate().fadeIn(duration: 250.ms).slideY(begin: 0.05, end: 0),
          ),
        ),
      ],
    );
  }

  // Resolves currently selected settings section UI
  Widget _buildActiveTabContent(
    SessionManager session,
    ThemeController themeCtrl,
    bool isDark,
  ) {
    switch (_activeTabIndex) {
      case 0:
        return _buildAccountSettings(session, themeCtrl, isDark);
      case 1:
        return _buildSecuritySettings(isDark);
      case 2:
        return _buildBiometricsSettings(isDark);
      case 3:
        return _buildGatewaySettings(isDark);
      case 4:
        return _buildDevicesSettings(session, isDark);
      default:
        return const SizedBox.shrink();
    }
  }

  // ============================================================================
  // Settings Tab Panels
  // ============================================================================

  // 1. Account Settings: Identity, Theme, and Sandbox Roles
  Widget _buildAccountSettings(
    SessionManager session,
    ThemeController themeCtrl,
    bool isDark,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('PROFILE IDENTITY'),
        const SizedBox(height: AppSpacing.sm),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              // Avatar circle with details
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.accent,
                    backgroundImage:
                        session.avatarUrl != null &&
                            session.avatarUrl!.isNotEmpty
                        ? NetworkImage(session.avatarUrl!)
                        : null,
                    child:
                        session.avatarUrl == null || session.avatarUrl!.isEmpty
                        ? Text(
                            (session.name ?? 'U').substring(0, 1).toUpperCase(),
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.name ?? 'Guest User',
                          style: AppText.subheading(
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        Text(
                          session.email ?? 'unregistered@university.edu',
                          style: AppText.body(
                            color: isDark ? Colors.white38 : Colors.black45,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            RoleBadge(role: session.userRole, compact: true),
                            if (session.biometricRegistered) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(
                                    alpha: 0.12,
                                  ),
                                  borderRadius: BorderRadius.circular(
                                    AppRadius.sm,
                                  ),
                                  border: Border.all(
                                    color: AppColors.success.withValues(
                                      alpha: 0.35,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  'FACE VERIFIED',
                                  style: AppText.label(
                                    color: AppColors.success,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              // Name Edit Textfield
              _buildSettingsTextField(
                controller: _nameController,
                label: 'Display Name',
                hint: 'e.g. Sachin Dev',
                icon: Icons.person_outline,
                isDark: isDark,
              ),
              const SizedBox(height: AppSpacing.md),
              // Avatar URL Textfield
              _buildSettingsTextField(
                controller: _avatarController,
                label: 'Avatar URL',
                hint: 'e.g. https://domain.com/photo.jpg',
                icon: Icons.link_rounded,
                isDark: isDark,
              ),
              const SizedBox(height: AppSpacing.lg),
              GlowButton(
                onPressed: _updateProfileIdentity,
                color: AppColors.gold,
                glowColor: AppColors.gold.withValues(alpha: 0.3),
                borderRadius: AppRadius.sm,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      size: 18,
                      color: Colors.black,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'UPDATE PROFILE DATA',
                      style: AppText.button(color: Colors.black),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        _buildSectionHeader('APPEARANCE THEME'),
        const SizedBox(height: AppSpacing.sm),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Light / Dark Mode Toggle',
                style: AppText.body(
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              Switch(
                value: isDark,
                onChanged: (val) {
                  HapticFeedback.lightImpact();
                  themeCtrl.toggle();
                },
                activeThumbColor: AppColors.gold,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        _buildSectionHeader('DEVELOPER SANDBOX ROLE picker'),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Hot-swap the active authenticated user role inside the security token environment. Instantly evaluates navigation routing guards.',
          style: AppText.caption(
            color: isDark ? Colors.white38 : Colors.black45,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildRoleSandboxButton(UserRole.student, session.userRole),
              _buildRoleSandboxButton(UserRole.teacher, session.userRole),
              _buildRoleSandboxButton(UserRole.admin, session.userRole),
            ],
          ),
        ),
      ],
    );
  }

  // Helper chip button for role switching
  Widget _buildRoleSandboxButton(UserRole role, UserRole currentRole) {
    final isSelected = role == currentRole;
    return InkWell(
      onTap: () => _switchRoleSandbox(role),
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? role.color.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(
            color: isSelected ? role.color : Colors.transparent,
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              role.icon,
              color: isSelected ? role.color : Colors.white38,
              size: 20,
            ),
            const SizedBox(height: 4),
            Text(
              role.label,
              style: AppText.label(
                color: isSelected ? role.color : Colors.white38,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Security Settings: timeouts & applock
  Widget _buildSecuritySettings(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('APP LOCK & SECURITY'),
        const SizedBox(height: AppSpacing.sm),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              // Timeout dropdown/choice chips
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Session Timeout Duration',
                    style: AppText.body(
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  DropdownButton<String>(
                    value: _sessionTimeout,
                    dropdownColor: isDark
                        ? AppColors.bgDeep
                        : AppColors.bgLight,
                    style: AppText.body(
                      color: isDark ? Colors.white : Colors.black87,
                      weight: FontWeight.bold,
                    ),
                    underline: const SizedBox.shrink(),
                    items: ['5 mins', '15 mins', '30 mins', '1 hour', 'Never']
                        .map((String val) {
                          return DropdownMenuItem<String>(
                            value: val,
                            child: Text(val),
                          );
                        })
                        .toList(),
                    onChanged: (newVal) {
                      if (newVal != null) {
                        setState(() => _sessionTimeout = newVal);
                        _savePreference('sf_session_timeout', newVal);
                        AppToast.show(
                          context,
                          message: 'Session timeout set to $newVal',
                          type: ToastType.success,
                        );
                      }
                    },
                  ),
                ],
              ),
              const Divider(height: AppSpacing.lg),
              // Biometric App Lock Switch
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Biometric App Lock Protection',
                        style: AppText.body(
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      Text(
                        'Requires Face ID verification on launch',
                        style: AppText.caption(),
                      ),
                    ],
                  ),
                  Switch(
                    value: _biometricAppLock,
                    activeThumbColor: AppColors.gold,
                    onChanged: (val) {
                      setState(() => _biometricAppLock = val);
                      _savePreference('sf_biometric_app_lock', val);
                      AppToast.show(
                        context,
                        message: val
                            ? 'App Lock activated!'
                            : 'App Lock deactivated!',
                        type: val ? ToastType.success : ToastType.warning,
                      );
                    },
                  ),
                ],
              ),
              const Divider(height: AppSpacing.lg),
              // Two-Factor Authentication Switch
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Two-Factor Authentication',
                        style: AppText.body(
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      Text(
                        'Sends secure verification codes on logins',
                        style: AppText.caption(),
                      ),
                    ],
                  ),
                  Switch(
                    value: _twoFactorAuth,
                    activeThumbColor: AppColors.gold,
                    onChanged: (val) {
                      setState(() => _twoFactorAuth = val);
                      _savePreference('sf_two_factor_auth', val);
                      AppToast.show(
                        context,
                        message: val ? '2FA enabled!' : '2FA disabled!',
                        type: val ? ToastType.success : ToastType.warning,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 3. Biometrics Settings: Sliders & Face ID retraining dialog
  Widget _buildBiometricsSettings(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('AI BIOMETRIC TELEMETRY'),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Tune the underlying face scanning accuracy algorithms. Increasing threshold increases strictness against spoofing/facial mimics.',
          style: AppText.caption(
            color: isDark ? Colors.white38 : Colors.black45,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Face Match Threshold
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Face Matching Threshold',
                    style: AppText.body(
                      color: isDark ? Colors.white : Colors.black87,
                      weight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${(_faceMatchingThreshold * 100).toInt()}% Confidence',
                    style: GoogleFonts.robotoMono(
                      color: AppColors.gold,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Slider(
                value: _faceMatchingThreshold,
                min: 0.50,
                max: 0.95,
                divisions: 9,
                activeColor: AppColors.gold,
                inactiveColor: isDark ? Colors.white10 : Colors.black12,
                onChanged: (val) {
                  setState(() => _faceMatchingThreshold = val);
                },
                onChangeEnd: (val) {
                  _savePreference('sf_face_match_threshold', val);
                  AppToast.show(
                    context,
                    message:
                        'Matching threshold updated: ${(val * 100).toInt()}%',
                    type: ToastType.info,
                  );
                },
              ),
              const Divider(height: AppSpacing.lg),
              // Liveness Strictness
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Liveness Guard Strictness',
                    style: AppText.body(
                      color: isDark ? Colors.white : Colors.black87,
                      weight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${(_livenessStrictness * 100).toInt()}% strict',
                    style: GoogleFonts.robotoMono(
                      color: AppColors.cyan,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Slider(
                value: _livenessStrictness,
                min: 0.50,
                max: 0.95,
                divisions: 9,
                activeColor: AppColors.cyan,
                inactiveColor: isDark ? Colors.white10 : Colors.black12,
                onChanged: (val) {
                  setState(() => _livenessStrictness = val);
                },
                onChangeEnd: (val) {
                  _savePreference('sf_liveness_strictness', val);
                  AppToast.show(
                    context,
                    message:
                        'Liveness strictness set to ${(val * 100).toInt()}%',
                    type: ToastType.info,
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        _buildSectionHeader('FACIAL MODEL RECONSTRUCTION'),
        const SizedBox(height: AppSpacing.sm),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enrollment Templates & Models',
                style: AppText.subheading(
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Reconstruct your institutional Face ID neural node embeddings. Helpful if your physical profile changes or detection degrades.',
                style: AppText.body(
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              GlowButton(
                onPressed: _runFaceRetrainingSimulation,
                color: AppColors.gold,
                glowColor: AppColors.gold.withValues(alpha: 0.3),
                borderRadius: AppRadius.sm,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.model_training_outlined,
                      size: 18,
                      color: Colors.black,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'RE-OPTIMIZE FACE ID EMBEDDINGS',
                      style: AppText.button(color: Colors.black),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 4. Gateway Settings: Server host & port connection
  Widget _buildGatewaySettings(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('SYSTEM ENDPOINT PARAMETERS'),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Base API endpoints for remote institutional analytics, WebSocket verification nodes, and database triggers.',
          style: AppText.body(color: isDark ? Colors.white54 : Colors.black54),
        ),
        const SizedBox(height: AppSpacing.lg),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSettingsTextField(
                controller: _hostController,
                label: 'Server Host IP / Domain',
                hint: 'e.g. 192.168.1.100 or api.smartface.ai',
                icon: Icons.link,
                isDark: isDark,
              ),
              const SizedBox(height: AppSpacing.md),
              _buildSettingsTextField(
                controller: _portController,
                label: 'Port Number',
                hint: 'e.g. 8000',
                icon: Icons.settings_ethernet,
                keyboardType: TextInputType.number,
                isDark: isDark,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Gateway Reachability Ping:',
                style: AppText.body(
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              _buildStatusIndicator(),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Expanded(
              child: GlowButton(
                onPressed: _testingConnection ? null : _testPing,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.black.withValues(alpha: 0.06),
                glowColor: isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.black.withValues(alpha: 0.1),
                borderRadius: AppRadius.sm,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _testingConnection
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.gold,
                            ),
                          )
                        : Icon(
                            Icons.network_ping,
                            size: 18,
                            color: isDark ? AppColors.gold : AppColors.indigo,
                          ),
                    const SizedBox(width: 8),
                    Text(
                      'TEST PING',
                      style: AppText.button(
                        color: isDark ? AppColors.gold : AppColors.indigo,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: GlowButton(
                onPressed: _saveGatewayConfig,
                color: AppColors.gold,
                glowColor: AppColors.gold.withValues(alpha: 0.3),
                borderRadius: AppRadius.sm,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.save_outlined,
                      size: 18,
                      color: Colors.black,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'SAVE CONFIG',
                      style: AppText.button(color: Colors.black),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // 5. Devices Settings: active access sessions list
  Widget _buildDevicesSettings(SessionManager session, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('AUTHORIZED ACCESS SESSIONS'),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'View and revoke device logins that have active credentials authenticated against your institutional token credentials.',
          style: AppText.caption(
            color: isDark ? Colors.white38 : Colors.black45,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _trustedDevices.length,
          separatorBuilder: (context, index) =>
              const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final dev = _trustedDevices[index];
            final isCurrent = dev['isCurrent'] == 'true';
            return GlassContainer(
              padding: const EdgeInsets.all(AppSpacing.md),
              borderColor: isCurrent
                  ? AppColors.success.withValues(alpha: 0.3)
                  : (isDark
                        ? Colors.white.withValues(alpha: 0.05)
                        : Colors.black.withValues(alpha: 0.05)),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? AppColors.success.withValues(alpha: 0.12)
                          : (isDark
                                ? Colors.white.withValues(alpha: 0.03)
                                : Colors.black.withValues(alpha: 0.03)),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      dev['name']!.contains('MacBook')
                          ? Icons.laptop_mac_rounded
                          : (dev['name']!.contains('iPad')
                                ? Icons.tablet_mac_rounded
                                : Icons.phone_android_rounded),
                      color: isCurrent
                          ? AppColors.success
                          : (isDark ? Colors.white70 : Colors.black87),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dev['name']!,
                          style: AppText.body(
                            color: isDark ? Colors.white : Colors.black87,
                            weight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${dev['location']} • ${dev['lastActive']}',
                          style: AppText.caption(),
                        ),
                      ],
                    ),
                  ),
                  if (!isCurrent)
                    IconButton(
                      icon: const Icon(
                        Icons.remove_circle_outline,
                        color: AppColors.errorLight,
                        size: 20,
                      ),
                      tooltip: 'Revoke Access',
                      onPressed: () => _revokeDevice(dev['id']!, dev['name']!),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'CURRENT',
                        style: AppText.label(color: AppColors.success),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: AppSpacing.xl),
        GlowButton(
          onPressed: _revokeAllSessions,
          color: AppColors.error,
          glowColor: AppColors.error.withValues(alpha: 0.4),
          borderRadius: AppRadius.sm,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.logout_rounded, size: 18, color: Colors.white),
              const SizedBox(width: 8),
              Text(
                'REVOKE ALL OTHER ACCESS TOKENS',
                style: AppText.button(color: Colors.white),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ============================================================================
  // Reusable Widgets & Render Helpers
  // ============================================================================

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: AppColors.gold,
      ),
    );
  }

  Widget _buildSettingsTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppText.body(
            color: isDark ? Colors.white70 : Colors.black54,
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(color: isDark ? Colors.white : Colors.black87),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? Colors.white38 : Colors.black38,
            ),
            prefixIcon: Icon(icon, color: AppColors.gold),
            filled: true,
            fillColor: isDark
                ? Colors.white.withValues(alpha: 0.02)
                : Colors.black.withValues(alpha: 0.02),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.sm),
              borderSide: BorderSide(
                color: isDark ? Colors.white12 : Colors.black12,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.sm),
              borderSide: BorderSide(
                color: isDark ? Colors.white12 : Colors.black12,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator() {
    if (_testingConnection) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(
              strokeWidth: 1.5,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(width: 8),
          Text('TESTING...', style: AppText.label(color: AppColors.gold)),
        ],
      );
    }

    switch (_connectionStatus) {
      case 'ONLINE':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text('ONLINE', style: AppText.label(color: AppColors.success)),
          ],
        );
      case 'OFFLINE':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text('OFFLINE', style: AppText.label(color: AppColors.error)),
          ],
        );
      default:
        return Text('UNTESTED', style: AppText.label(color: Colors.white38));
    }
  }

  // Full screen blurring neural optimizer progress view
  Widget _buildRetrainingOverlay() {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
      child: Container(
        color: Colors.black.withValues(alpha: 0.75),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Neural scanning target reticle
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                          height: 150,
                          width: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.gold.withValues(alpha: 0.15),
                              width: 3,
                            ),
                          ),
                        )
                        .animate(onPlay: (c) => c.repeat())
                        .rotate(duration: 4.seconds),
                    CircularProgressIndicator(
                      value: _retrainingProgress,
                      strokeWidth: 4,
                      backgroundColor: Colors.white10,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        AppColors.gold,
                      ),
                    ),
                    const Icon(
                          Icons.blur_on_rounded,
                          color: AppColors.gold,
                          size: 60,
                        )
                        .animate(onPlay: (c) => c.repeat())
                        .shimmer(delay: 500.ms, duration: 1500.ms),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'OPTIMIZING FACE ID ARCHITECTURE',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _retrainingStatusText,
                  style: GoogleFonts.robotoMono(
                    fontSize: 12,
                    color: AppColors.gold.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                // Linear Progress bar percentage text
                Text(
                  '${(_retrainingProgress * 100).toInt()}% COMPLETE',
                  style: AppText.label(color: Colors.white38),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Background glow circles mesh decoration
  Widget _buildGlowMeshBackground() {
    return Stack(
      children: [
        // Cobalt Glow Circle
        Positioned(
          top: -100,
          right: -50,
          child: Container(
            width: 300,
            height: 300,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.accent.withValues(alpha: 0.08),
            ),
          ),
        ),
        // Cyber Cyan Glow Circle
        Positioned(
          bottom: -100,
          left: -80,
          child: Container(
            width: 350,
            height: 350,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cyan.withValues(alpha: 0.06),
            ),
          ),
        ),
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
          child: Container(color: Colors.transparent),
        ),
      ],
    );
  }
}
