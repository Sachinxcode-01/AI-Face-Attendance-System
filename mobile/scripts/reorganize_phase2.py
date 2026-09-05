import os
import shutil

# Root directory of smartface_mobile
ROOT_DIR = r"c:\Users\kalin\OneDrive\Documents\Projects\SmartFace-attendance\smartface_mobile"

# Mapping of old paths to new paths relative to ROOT_DIR
MIGRATION_MAP = {
    os.path.join("lib", "core", "config", "env_config.dart"): os.path.join("lib", "app", "config", "env_config.dart"),
    os.path.join("lib", "core", "theme", "theme_controller.dart"): os.path.join("lib", "app", "theme", "theme_controller.dart"),
    os.path.join("lib", "core", "widgets", "glassmorphic_card.dart"): os.path.join("lib", "shared", "widgets", "glassmorphic_card.dart"),
    os.path.join("lib", "core", "widgets", "shimmer_loader.dart"): os.path.join("lib", "shared", "widgets", "shimmer_loader.dart"),
    os.path.join("lib", "core", "widgets", "toast_system.dart"): os.path.join("lib", "shared", "widgets", "toast_system.dart"),
    os.path.join("lib", "core", "services", "app_state.dart"): os.path.join("lib", "app", "config", "app_state.dart"),
    os.path.join("lib", "core", "storage", "cache_service.dart"): os.path.join("lib", "app", "config", "cache_service.dart"),
    os.path.join("lib", "core", "constants", "app_constants.dart"): os.path.join("lib", "app", "constants", "app_constants.dart"),
}

# Old imports / package references to new ones
REPLACEMENTS = {
    "package:smartface_attendance/core/config/env_config.dart": "package:smartface_attendance/app/config/env_config.dart",
    "package:smartface_attendance/core/theme/theme_controller.dart": "package:smartface_attendance/app/theme/theme_controller.dart",
    "package:smartface_attendance/core/widgets/glassmorphic_card.dart": "package:smartface_attendance/shared/widgets/glassmorphic_card.dart",
    "package:smartface_attendance/core/widgets/shimmer_loader.dart": "package:smartface_attendance/shared/widgets/shimmer_loader.dart",
    "package:smartface_attendance/core/widgets/toast_system.dart": "package:smartface_attendance/shared/widgets/toast_system.dart",
    "package:smartface_attendance/core/services/app_state.dart": "package:smartface_attendance/app/config/app_state.dart",
    "package:smartface_attendance/core/storage/cache_service.dart": "package:smartface_attendance/app/config/cache_service.dart",
    "package:smartface_attendance/core/constants/app_constants.dart": "package:smartface_attendance/app/constants/app_constants.dart",
    
    # Comments/documentation fixes
    "package:smartface_attendance/presentation/widgets/glassmorphic_card.dart": "package:smartface_attendance/shared/widgets/glassmorphic_card.dart",
    "package:smartface_attendance/presentation/widgets/shimmer_loader.dart": "package:smartface_attendance/shared/widgets/shimmer_loader.dart",
    "package:smartface_attendance/presentation/widgets/toast_system.dart": "package:smartface_attendance/shared/widgets/toast_system.dart",
}

def migrate_files():
    print("--- Phase 2 Migration: Moving Files ---")
    for old_rel, new_rel in MIGRATION_MAP.items():
        old_path = os.path.join(ROOT_DIR, old_rel)
        new_path = os.path.join(ROOT_DIR, new_rel)
        
        if os.path.exists(old_path):
            new_dir = os.path.dirname(new_path)
            os.makedirs(new_dir, exist_ok=True)
            print(f"Moving: {old_rel} -> {new_rel}")
            shutil.move(old_path, new_path)
        else:
            print(f"Skipping (not found): {old_rel}")

    # Remove the dashboard_router.dart file
    old_router = os.path.join(ROOT_DIR, "lib", "core", "navigation", "dashboard_router.dart")
    if os.path.exists(old_router):
        print("Deleting old dashboard_router.dart...")
        os.remove(old_router)
        
    # Clean up empty directories in core
    core_widgets = os.path.join(ROOT_DIR, "lib", "core", "widgets")
    if os.path.exists(core_widgets) and not os.listdir(core_widgets):
        print("Cleaning up empty directory: lib/core/widgets")
        os.rmdir(core_widgets)

    core_config = os.path.join(ROOT_DIR, "lib", "core", "config")
    if os.path.exists(core_config) and not os.listdir(core_config):
        print("Cleaning up empty directory: lib/core/config")
        os.rmdir(core_config)

    core_theme = os.path.join(ROOT_DIR, "lib", "core", "theme")
    if os.path.exists(core_theme) and not os.listdir(core_theme):
        print("Cleaning up empty directory: lib/core/theme")
        os.rmdir(core_theme)

    core_constants = os.path.join(ROOT_DIR, "lib", "core", "constants")
    if os.path.exists(core_constants) and not os.listdir(core_constants):
        print("Cleaning up empty directory: lib/core/constants")
        os.rmdir(core_constants)

    core_navigation = os.path.join(ROOT_DIR, "lib", "core", "navigation")
    if os.path.exists(core_navigation) and not os.listdir(core_navigation):
        print("Cleaning up empty directory: lib/core/navigation")
        os.rmdir(core_navigation)

    # Clean up lib/presentation folder if empty
    presentation_dir = os.path.join(ROOT_DIR, "lib", "presentation")
    if os.path.exists(presentation_dir):
        print("Cleaning up lib/presentation directory...")
        shutil.rmtree(presentation_dir, ignore_errors=True)

def update_imports():
    print("\n--- Phase 2 Migration: Updating Imports in lib/ and test/ ---")
    search_dirs = [os.path.join(ROOT_DIR, "lib"), os.path.join(ROOT_DIR, "test")]
    updated_files_count = 0
    
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
        for root, _, files in os.walk(search_dir):
            for file in files:
                if file.endswith(".dart"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        
                        modified = False
                        new_content = content
                        for old_import, new_import in REPLACEMENTS.items():
                            if old_import in new_content:
                                new_content = new_content.replace(old_import, new_import)
                                modified = True
                        
                        if modified:
                            with open(file_path, "w", encoding="utf-8", newline="") as f:
                                f.write(new_content)
                            print(f"Updated imports in: {os.path.relpath(file_path, ROOT_DIR)}")
                            updated_files_count += 1
                    except Exception as e:
                        print(f"Error updating imports in {file}: {e}")
                        
    print(f"Total files updated: {updated_files_count}")

if __name__ == "__main__":
    migrate_files()
    update_imports()
    print("Migration finished!")
