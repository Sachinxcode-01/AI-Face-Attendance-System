# Package Migration Validation Document

## Package Identity Transition
- **Legacy Prototype Package**: `com.example.smartface_attendance`
- **Production Package**: `pro.smartface.attendance`

---

## Technical Migration Guidelines

1. **App Identity & Coexistence**:
   Android OS treats `pro.smartface.attendance` as a completely separate application from `com.example.smartface_attendance`. Both applications can coexist on the same physical Android device without package collision.

2. **Offline Data Synchronization**:
   Before installing `pro.smartface.attendance`, users with pending local offline records in `com.example.smartface_attendance` must trigger a manual or automatic sync while connected to the internet.

3. **Authentication & Session Restoration**:
   Installing `pro.smartface.attendance` requires users to authenticate via OTP login. Once authenticated, user profile data, attendance history, academic timetables, and notification feeds are loaded seamlessly from the backend database.

4. **Biometric Enrolment & Consent**:
   Users agree to the standard biometric enrolment consent upon first launch of `pro.smartface.attendance`. Pre-existing face vector embeddings saved in MongoDB remain linked to the user's account and are instantly active.

5. **Legacy App Removal**:
   After verifying login and attendance submission on `pro.smartface.attendance`, the legacy application (`com.example.smartface_attendance`) may be uninstalled from the device.
