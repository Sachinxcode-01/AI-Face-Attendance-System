# SmartFace Mobile — Directory Structure & Feature-First Architecture

This document outlines the architecture and directory structure of the **SmartFace Mobile Client** (Flutter).

## High-Level Architecture Pattern

The application follows a **Clean Feature-First Architecture** ensuring clear separation of concerns, scalability, and testability:

```text
lib/
├── app/                  # Application bootstrap, routing, themes & DI setup
│   ├── di/               # GetIt service locator & dependency injection registrations
│   ├── routing/          # Declarative GoRouter configuration, route guards & path constants
│   ├── theme/            # Theme mode state, dark/light definitions, color & typography tokens
│   └── app.dart          # Root SmartAttendanceApp MaterialApp binding
│
├── core/                 # Shared infrastructure, network, security & offline sync
│   ├── config/           # Environment config, app constants & runtime state
│   ├── network/          # ApiService HTTP client, WebSocket client, interceptors
│   ├── security/         # SessionManager, JWT lifecycle, secure token storage
│   ├── sync/             # Offline sync engine, local cache & SQLite persistence
│   └── utils/            # Platform utilities, formatters, validation helpers
│
├── data/                 # Data layer: repository contracts, models & remote services
│   ├── models/           # Typed immutable Dart data transfer objects & serialization
│   ├── repositories/     # Concrete repository implementations (attendance, auth, profile)
│   └── services/         # Device hardware services (biometrics, camera, notifications)
│
├── design_system/        # Core UI primitives & design tokens
│   ├── tokens/           # Spacing, radius, elevation & color palettes
│   └── ui/               # Base UI tokens (glassmorphism, gradient surfaces)
│
├── features/             # Feature modules (Domain-driven vertical slices)
│   ├── auth/             # Login, OTP verification, biometric registration & onboarding
│   ├── attendance/       # Live face recognition, QR scanner & check-in flow
│   ├── student/          # Student home, timetable, bunk calculator, stats & attendance rings
│   ├── teacher/          # Teacher console, class session initiator, dynamic QR projector
│   ├── admin/            # Admin telemetry, live intruder logs & system status
│   ├── profile/          # Profile studio, digital student ID card, avatar upload
│   ├── leave/            # Leave application submission, tracking & approval inbox
│   ├── ai_chat/          # AI student advisor & assistant conversation interface
│   └── notifications/    # In-app notification center & push alert handlers
│
├── shared/               # Reusable cross-feature UI components
│   ├── components/       # Glassmorphic cards, shimmer loaders, charts, buttons
│   └── widgets/          # Floating toast system, animated icons, badge tags
│
└── main.dart             # Application entry point with async pre-initialization
```

## Directory Organization Rules

1. **Feature Encapsulation**: Keep screen-specific state, controllers, and sub-widgets inside their respective `features/<feature_name>/` folder.
2. **Shared Reusability**: Reusable atoms, layout cards, and shared UI primitives belong in `shared/` or `design_system/`.
3. **Clean Data Flow**: Views call controllers/Cubits/providers, which interact with repositories in `data/`, which communicate via `ApiService` in `core/network/`.
4. **Strong Typing & Serialization**: All models in `data/models/` must provide `fromJson` and `toJson` methods for safe serialization.
