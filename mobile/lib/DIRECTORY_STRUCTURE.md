# Nexa AI — Directory Structure & Clean Architecture Walkthrough

This document outlines the high-level architecture and folder structure of the **Nexa AI** mobile client.

## High-Level Architecture Pattern

The application is structured using a simplified **Clean Architecture** pattern to achieve strict separation of concerns, high maintainability, and testability. The application logic is segmented into three primary root layers:

```
lib/
├── core/              # System-wide infrastructure & configurations
│   ├── di/            # Dependency injection registry (service locator)
│   ├── state/         # Core reactive engines (session, themes, global loading)
│   └── constants.dart # Design system constants (colors, text styles, sizing)
│
├── data/              # Data layer: remote APIs, databases, & cached models
│   ├── models/        # Standard data schema definitions
│   └── services/      # REST API client, cache controllers, local notifications
│
└── presentation/      # Presentation UI elements
    ├── layouts/       # Scaffolding layouts and container wrappers
    ├── screens/       # Views bound to user routes (login, dashboards, stats)
    └── widgets/       # Global reusable components (glassmorphic panels, shimmer loaders)
```

---

## Detailed Directory Breakdown

### 1. `lib/core/`
This folder houses system-wide configurations, design styles, and global controllers.

| Subfolder/File | Purpose | Key Responsibilities |
|---|---|---|
| `constants.dart` | Theme colors, padding spacings, text styles | Establishes the design tokens (e.g. `AppColors.gold`, `AppRadius.md`). |
| `di/` | Dependency Injection | Registers classes like `ApiService` and `SessionManager` in a `GetIt` service locator container. |
| `state/` | App-wide State Managers | Manages global themes, loading states, and JWT token sessions. |

### 2. `lib/data/`
This layer interfaces with local storage and the remote backend, converting network payloads to Dart entities.

| Subfolder/File | Purpose | Key Responsibilities |
|---|---|---|
| `models/` | Immutable Data Structures | Parses JSON schemas into typed Dart models (`LeaveModel`, `StudentStatsModel`). |
| `services/` | Integration services | Runs standard GET/POST REST calls, schedules local notifications, handles biometric settings caching. |

### 3. `lib/presentation/`
The UI presentation layer that handles widgets, canvas drawing, screens, animations, and user inputs.

| Subfolder/File | Purpose | Key Responsibilities |
|---|---|---|
| `layouts/` | General screen scaffolds | Modular wrappers for specific screen forms. |
| `screens/` | Views/Pages | Route endpoints (e.g. `LoginScreen`, `StudentDashboard`). Subdivided by actor (`admin`, `teacher`, `student`, `auth`, `main`). |
| `widgets/` | Reusable Atoms & Molecules | Reusable layouts such as `GlassmorphicCard`, `ShimmerLoader`, and the custom floating `ToastSystem`. |

---

## Project Organization Guidelines

1. **No Root Files**: All source code files must live within one of the three modular directories (`core/`, `data/`, or `presentation/`). The only exception is `main.dart` which is the application entry point.
2. **Absolute Imports**: Always prefer absolute package imports (`import 'package:smartface_attendance/...'`) over nested relative imports (`../../..`). This avoids broken links during restructuring and refactoring.
3. **Immutability**: Ensure all classes in `data/models/` remain immutable using final fields and include `fromJson` constructor mappings.
