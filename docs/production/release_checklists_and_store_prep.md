# Flutter Release Checklist & Google Play Store Preparation

This document outlines the mobile client build instructions, signing procedures, performance/size optimizations, and Play Store release assets for the **SmartFace AI Mobile App**.

---

## 📱 Flutter Release & Build Configuration

To deploy the Flutter client for Android in production, follow this checklist to secure and optimize the binary.

### 1. Obfuscation & Reverse-Engineering Defense
To protect the app’s intellectual property and business logic (like HMAC offline signing and database encryption keys) from reverse engineering, obfuscation is mandatory:
*   **Release Build Command**:
    ```bash
    flutter build appbundle \
      --release \
      --obfuscate \
      --split-debug-info=build/app/outputs/symbols \
      --build-name=2.0.0 \
      --build-number=1
    ```
    *   `--obfuscate`: Renames Dart class, method, and variable names to short random characters.
    *   `--split-debug-info`: Strips debug symbols out of the app bundle and saves them locally, reducing download size by up to 30%. Keep the symbols folder to symbolicate crash logs on Sentry/Firebase.

### 2. Bundle Size Optimization
*   **ABI Splitting (for direct APK downloads)**: If distributing direct APKs, compile separate files for each architecture (`armeabi-v7a`, `arm64-v8a`, `x86_64`) rather than compiling a unified fat APK:
    ```bash
    flutter build apk --release --split-per-abi --obfuscate --split-debug-info=build/app/outputs/symbols
    ```
*   **Asset Cleaning**: Verify that raw training image datasets or debug mock models are excluded from the `assets/` directory specified in `pubspec.yaml` to keep download size below 20MB.

### 3. Release Signing Config (`android/key.properties`)
Create a `key.properties` file inside `smartface_mobile/android` to handle release keystores securely (this file is gitignored):
```properties
storeFile=release-key.jks
storePassword=SECURE_KEYSTORE_PASSWORD
keyAlias=smartface-release-alias
keyPassword=SECURE_KEY_PASSWORD
```
Then, update the app-level `build.gradle.kts` configuration to load these keys:
```kotlin
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
        }
    }
}
```

### 4. Proguard / R8 Shrinking Rules
Add the following rules to `android/app/proguard-rules.pro` to prevent R8 from stripping reflection files or custom model classes used by the face recognition libraries:
```proguard
-keep class com.smartface.smartface_attendance.** { *; }
-dontwarn com.smartface.smartface_attendance.**
-keep class org.tensorflow.lite.** { *; }
```

---

## 🏬 Play Store Listing Content & Prep

Prepare the store listing details before starting the submission workflow in Google Play Console.

### 1. App Description Metadata

*   **App Name**: SmartFace AI Attendance
*   **Short Description**: Secure, real-time biometric attendance system for institutions.
*   **Full Description**:
    ```text
    SmartFace AI is the next-generation biometric attendance management platform designed for educational institutions, schools, and universities.
    
    Using secure, state-of-the-art face matching technology, SmartFace AI enables students to mark attendance in seconds and allows teachers to initiate, track, and manage active session attendance logs in real time.
    
    Key Features:
    - Lightning-fast face matching for offline-first local verification.
    - Automated attendance session command centers for staff.
    - Real-time notifications and live classroom metrics.
    - Offline support with secure local encryption.
    - Encrypted data pipelines protecting privacy and student records.
    
    Simplify your institution's attendance workflow and eliminate manual tracking with SmartFace AI.
    ```

### 2. Privacy Policy Checklist (GDPR & FERPA Compliance)
Since the app captures facial features (biometric data), you must host and link a strict Privacy Policy. Ensure your policy includes:
- [ ] **Biometric Data Declaration**: Explicitly state that face models (vectors) are processed, locally encrypted, and never sold or shared with third parties.
- [ ] **FERPA Compliance (for US Institutions)**: Declare that student record access is governed by FERPA guidelines and accessible only to school administrators.
- [ ] **Consent Management**: State that students give explicit permission when registering their initial face profiles.
- [ ] **Data Erasure**: Provide a clear instructions link for students to request deletion of their biometric templates.

### 3. Store Graphic Assets Checklist
- [ ] **App Icon**: `512 x 512 px` PNG, max size 1MB, no alpha channel.
- [ ] **Feature Graphic**: `1024 x 500 px` PNG or JPEG.
- [ ] **Screenshots Checklist** (min 4, max 8 screenshots):
    *   *Screenshot 1*: Student Home Screen showing current attendance score & streaks.
    *   *Screenshot 2*: Face Scanner Interface with overlay guides.
    *   *Screenshot 3*: Teacher Command Center listing live attendance logs.
    *   *Screenshot 4*: Leaves Request flow and notification inbox.
- [ ] **Tablet Screenshots**: 7-inch and 10-inch landscape layouts for classroom registration tablets.
