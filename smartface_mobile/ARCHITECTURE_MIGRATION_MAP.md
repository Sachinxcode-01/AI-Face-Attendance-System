# SmartFace AI — Clean Feature-First Architecture Migration Map

## Architectural Transformation Overview

This document maps all original file paths in `smartface_mobile/lib` to their new Clean Architecture locations, detailing their layer responsibilities, dependency mappings, and migration status.

---

## 1. App Layer (`lib/app/`)
*Application startup, global configuration, dependency injection bootstrap, main MaterialApp, global router, themes, and application shells.*

| Original File Path | New File Path | Layer & Responsibility | Status |
| :--- | :--- | :--- | :--- |
| `lib/app/app.dart` | `lib/app/app.dart` | Root `SmartAttendanceApp` MaterialApp widget binding | Mapped |
| `lib/app/config/env_config.dart` | `lib/core/config/env_config.dart` | Environment configuration & Firebase options loader | Mapped |
| `lib/app/config/app_state.dart` | `lib/core/config/app_state.dart` | Global app runtime state management | Mapped |
| `lib/app/theme/theme_controller.dart` | `lib/app/theme/app_theme_controller.dart` | Theme mode state & dark/light theme definitions | Mapped |
| `lib/app/router/app_router.dart` | `lib/app/routing/app_router.dart` | Declarative GoRouter configuration & route definitions | Mapped |
| `lib/app/router/route_names.dart` | `lib/app/routing/app_routes.dart` | Central route path & name constants | Mapped |
| `lib/app/router/route_guards.dart` | `lib/app/routing/route_guards.dart` | Authentication & role navigation redirect guards | Mapped |
| `lib/core/di/service_locator.dart` | `lib/app/di/service_locator.dart` | GetIt dependency injection setup & service registration | Mapped |

---

## 2. Core Layer (`lib/core/`)
*Infrastructure used throughout the application: networking, security, storage, constants, models, and utilities.*

| Original File Path | New File Path | Layer & Responsibility | Status |
| :--- | :--- | :--- | :--- |
| `lib/core/network/api_service.dart` | `lib/core/network/api_service.dart` | Central HTTP client & backend REST API communication | Mapped |
| `lib/core/constants/app_constants.dart` | `lib/core/constants/app_constants.dart` | Global application constants & timeout values | Mapped |
| `lib/design_system/ui/app_colors.dart` | `lib/app/theme/app_colors.dart` | Theme color palette & gradient tokens | Mapped |
| `lib/design_system/ui/app_typography.dart` | `lib/app/theme/app_typography.dart` | Inter & Outfit GoogleFonts typography styles | Mapped |
| `lib/design_system/ui/app_spacing.dart` | `lib/app/theme/app_spacing.dart` | Layout spacing & border radius constants | Mapped |
| `lib/features/auth/controllers/session_manager.dart` | `lib/core/security/session_manager.dart` | JWT token, user identity & session state manager | Mapped |

---

## 3. Shared Layer (`lib/shared/`)
*Reusable presentation components, widgets, animations, dialogs, loaders, and extensions.*

| Original File Path | New File Path | Layer & Responsibility | Status |
| :--- | :--- | :--- | :--- |
| `lib/design_system/components/app_staggered_animations.dart` | `lib/shared/animations/app_staggered_animations.dart` | Reusable staggered entrance list/grid/column/row widgets | Mapped |
| `lib/shared/widgets/glass_container.dart` | `lib/shared/widgets/cards/glass_container.dart` | Glassmorphic container wrapper | Mapped |
| `lib/shared/widgets/glassmorphic_card.dart` | `lib/shared/widgets/cards/glassmorphic_card.dart` | Elevated glassmorphic card widget | Mapped |
| `lib/shared/widgets/glow_button.dart` | `lib/shared/widgets/buttons/glow_button.dart` | Glowing accent CTA action button | Mapped |
| `lib/shared/widgets/shimmer_loader.dart` | `lib/shared/widgets/loading/shimmer_loader.dart` | Shimmer loading skeleton effect | Mapped |
| `lib/shared/widgets/toast_system.dart` | `lib/shared/widgets/feedback/toast_system.dart` | AppToast success/error notification banners | Mapped |
| `lib/shared/widgets/smart_salomon_bottom_bar.dart` | `lib/shared/widgets/navigation/smart_salomon_bottom_bar.dart` | Custom bottom navigation bar | Mapped |
| `lib/shared/widgets/smart_charts.dart` | `lib/shared/widgets/charts/smart_charts.dart` | Syncfusion & fl_chart analytic chart wrappers | Mapped |

---

## 4. Nexa Assistant Feature (`lib/features/nexa_assistant/`)
*Floating AI Chatbot assistant feature module.*

| Original File Path | New File Path | Layer & Responsibility | Status |
| :--- | :--- | :--- | :--- |
| `lib/features/chatbot/controllers/chatbot_controller.dart` | `lib/features/nexa_assistant/presentation/controllers/nexa_assistant_controller.dart` | Chatbot state, toggle, position snapping & persistence | Mapped |
| `lib/features/chatbot/widgets/floating_chatbot_overlay.dart` | `lib/features/nexa_assistant/presentation/widgets/floating_chatbot_overlay.dart` | Draggable, edge-snapping floating chatbot overlay | Mapped |
| `lib/features/chatbot/widgets/nexa_chat_sheet.dart` | `lib/features/nexa_assistant/presentation/widgets/nexa_chat_sheet.dart` | Draggable chat modal sheet interface | Mapped |
| `lib/features/chatbot/models/chat_message.dart` | `lib/features/nexa_assistant/data/models/nexa_message_model.dart` | Chat message data model & JSON serialization | Mapped |

---

## 5. Role Modules (`lib/features/roles/`)
*Role-specific UI screens and navigation shells.*

| Role | Original File Path | New File Path | Status |
| :--- | :--- | :--- | :--- |
| **Student** | `lib/features/student/screens/student_home_screen.dart` | `lib/features/roles/student/dashboard/student_dashboard_screen.dart` | Mapped |
| **Student** | `lib/features/student/screens/student_timetable_screen.dart` | `lib/features/roles/student/timetable/student_timetable_screen.dart` | Mapped |
| **Teacher** | `lib/features/teacher/screens/teacher_dashboard_screen.dart` | `lib/features/roles/teacher/dashboard/teacher_dashboard_screen.dart` | Mapped |
| **Parent** | `lib/features/parent/screens/parent_dashboard_screen.dart` | `lib/features/roles/parent/dashboard/parent_dashboard_screen.dart` | Mapped |
| **Admin** | `lib/features/admin/screens/admin_home_screen.dart` | `lib/features/roles/admin/dashboard/admin_dashboard_screen.dart` | Mapped |
