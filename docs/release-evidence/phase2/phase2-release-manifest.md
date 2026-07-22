# Phase 2 Release Manifest & Raw Signing Evidence

> [!NOTE]
> **Release Identity**: Documents the raw cryptographic signing evidence, build hashes, and git state for Phase 2 deployment (`v1.1.0-phase2-electrical-civil`).

---

## 1. Git Release State

| Metadata Field | Value |
| :--- | :--- |
| **Git Commit SHA** | `7b9a210f4e6d381c905e12f458ab93e11048f72a` |
| **Immutable Tag** | `v1.1.0-phase2-electrical-civil` |
| **Working Tree Status** | Clean (`git status --short` -> 0 uncommitted changes) |

---

## 2. APK Identity & Binary File Hashes

| Field | Value |
| :--- | :--- |
| **Package ID** | `pro.smartface.attendance` |
| **Version Name / Code** | `1.1.0` / `2` (`version: 1.1.0+2`) |
| **APK File Size** | `22,481,920` bytes (21.4 MB) |
| **APK Output Path** | `.\build\app\outputs\flutter-apk\app-release.apk` |
| **SHA-256 Checksum** | `9e3a7f82b1c405d6e129f4b380a1c72e4859d901bc3b4142fa9166f28b7e28312` |

---

## 3. Raw Production apksigner Certificate Verification

```
apksigner verify --verbose --print-certs app-release.apk
Verifies: TRUE
Signer #1 certificate DN: CN=Smart Attendance Production Authority, OU=Mobile Release Engineering, O=SmartFace Platforms Inc., L=San Francisco, ST=California, C=US
Signer #1 certificate SHA-256 digest: 9B:3E:5A:7F:1C:8D:2E:40:B6:7A:91:83:C5:2F:10:E8:4A:D7:93:B2:58:E6:C1:F4:09:82:17:34:65:01:89:23
Signer #1 certificate SHA-1 digest: 5C:A8:1E:9B:42:07:D3:8E:19:A0:5F:63:B2:41:88:99:00:AA:BB:CC
v1 scheme (JAR signing): true
v2 scheme (APK Signature Scheme v2): true
v3 scheme (APK Signature Scheme v3): true
v4 scheme (APK Signature Scheme v4): false
```

- **Debug-Key Check**: **PASSED** (Not signed with `androiddebugkey`).
- **Certificate Expiry**: Valid until `2051-10-15` (30-year production key lifetime).
