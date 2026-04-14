# macOS Code Signing & Notarization Guide

## Prerequisites

- **Apple Developer Program** membership ($99/yr) — required for Developer ID certificates and notarization
- **Xcode Command Line Tools** installed locally

---

## Step 1: Generate a Certificate Signing Request (CSR)

1. Open **Keychain Access** (Spotlight → "Keychain Access")
2. Menu bar → **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority**
3. Fill in:
   - **User Email:** your Apple ID email
   - **Common Name:** `FluxBox`
   - **CA Email:** leave blank
   - Select **"Saved to disk"**
4. Save the `.certSigningRequest` file

---

## Step 2: Create the Certificate on Apple Developer

1. Go to [developer.apple.com/account/resources/certificates/add](https://developer.apple.com/account/resources/certificates/add)
2. Select **"Developer ID Application"** → Continue
3. Click through the Developer ID Certificate Intermediate prompt
4. Upload your `.certSigningRequest` file → Continue
5. Download the resulting `developerID_application.cer`

---

## Step 3: Install the Certificate

Double-click `developerID_application.cer` — it installs into Keychain Access, pairing with the private key from Step 1.

---

## Step 4: Export as `.p12`

1. In **Keychain Access**, go to the **My Certificates** category
2. Find **"Developer ID Application: Raunaq..."**
3. Right-click → **Export**
4. Format: **Personal Information Exchange (.p12)**
5. Set a strong password — this becomes `APPLE_CERTIFICATE_PASSWORD`
6. Save as `fluxbox_cert.p12`

---

## Step 5: Base64 Encode for GitHub

```bash
base64 -i fluxbox_cert.p12 | pbcopy
```

Paste the clipboard value as the `APPLE_CERTIFICATE` GitHub secret.

---

## Step 6: Find Your Signing Identity

```bash
security find-identity -v -p codesigning
```

It will look like:
```
Developer ID Application: Raunaq <XXXXXXXXXX>
```

---

## Step 7: Get an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → **App-Specific Passwords**
2. Generate a new password for "FluxBox CI"
3. Save it — this becomes `APPLE_PASSWORD`

---

## Step 8: Add GitHub Secrets

In your repo → Settings → Secrets and variables → Actions, add:

| Secret Name | Value |
|---|---|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` from Step 5 |
| `APPLE_CERTIFICATE_PASSWORD` | Password set during `.p12` export |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Raunaq (TEAMID)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password from Step 7 |
| `APPLE_TEAM_ID` | Your 10-char team ID from developer.apple.com |

Your Team ID is visible at [developer.apple.com/account](https://developer.apple.com/account) in the top-right membership details.

---

## Step 9: Add Entitlements File

Create `src-tauri/entitlements.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <false/>
</dict>
</plist>
```

> Sandbox must be `false` — FluxBox uses `mdfind`, recent apps, global shortcuts, and `macOSPrivateApi` which are incompatible with the App Sandbox.

---

## Step 10: Update `tauri.conf.json`

Add a `macOS` block inside `bundle`:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "macOS": {
    "entitlements": "entitlements.plist",
    "signingIdentity": null,
    "notarizationCredentials": null
  },
  "icon": [...]
}
```

Leave `signingIdentity` and `notarizationCredentials` as `null` — Tauri reads them from the env vars at build time.

---

## Step 11: Update `.github/workflows/release.yml`

Add the signing env vars to the `tauri-apps/tauri-action` step:

```yaml
- uses: tauri-apps/tauri-action@v0
  id: tauri
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    VITE_API_URL: ${{ vars.VITE_API_URL }}
    VITE_APTABASE_APP_KEY: ${{ secrets.VITE_APTABASE_APP_KEY }}
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  with:
    tagName: v__VERSION__
    releaseName: "FluxBox v__VERSION__"
    releaseBody: "See the assets beneath for the latest binary."
    releaseDraft: false
    prerelease: false
```

`tauri-apps/tauri-action` detects these env vars automatically and handles signing + notarization — no extra script needed.

---

## Checklist

- [ ] Apple Developer Program membership active
- [ ] CSR generated in Keychain Access
- [ ] Developer ID Application certificate downloaded and installed
- [ ] `.p12` exported with a strong password
- [ ] `.p12` base64-encoded and added as `APPLE_CERTIFICATE` secret
- [ ] All 6 GitHub secrets added
- [ ] `src-tauri/entitlements.plist` created
- [ ] `tauri.conf.json` updated with `macOS` bundle section
- [ ] `release.yml` updated with signing env vars
