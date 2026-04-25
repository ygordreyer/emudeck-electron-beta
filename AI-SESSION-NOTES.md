# AI Session Notes — EmuDeck macOS Fork Setup

> **Date:** April 25, 2026  
> **AI:** Cline (Claude 3.7 Sonnet)  
> **GitHub user:** ygordreyer  
> **Session goal:** Fork EmuDeck, merge all pending PRs, add macOS support, publish v2.5.1

---

## Overview

This document captures exactly what was done in this AI session so any future AI or developer can understand the full context, reproduce the setup, or continue from where we left off.

---

## Repositories Created

| Repo | Purpose |
|---|---|
| `ygordreyer/emudeck-electron-beta` | Fork of `EmuDeck/emudeck-electron-beta` — the Electron UI app |
| `ygordreyer/EmuDeck` | Fork of `dragoonDorise/EmuDeck` — the bash backend scripts |

Both repos are live and have been modified. Local clones are at `~/Desktop/emudeck-work/`.

---

## Architecture (Important for Context)

The EmuDeck system has **two separate repos**:

```
┌─────────────────────────────────────────────────────────┐
│   Electron App (ygordreyer/emudeck-electron-beta)       │
│   - TypeScript/React frontend                           │
│   - On first install, clones the backend repo via git   │
│   - Runs: bash ~/.config/EmuDeck/backend/setup.sh       │
└─────────────────────────────────┬───────────────────────┘
                                  │ git clone at runtime
                                  ▼
┌─────────────────────────────────────────────────────────┐
│   Backend (ygordreyer/EmuDeck)                         │
│   - Pure bash scripts                                   │
│   - Installs emulators, writes configs                  │
│   - Lives at: ~/.config/EmuDeck/backend/               │
└─────────────────────────────────────────────────────────┘
```

- There is also a **submodule** (`EmuDeck/emudeck-gui-components`) at `src/renderer/components` — this is just the React UI component library and is **not** related to macOS issues.
- The backend is **not a submodule**; it is cloned at runtime by `src/main/main.ts`.

---

## What Was Changed and Why

### 1. Electron App Fork (ygordreyer/emudeck-electron-beta)

#### Branch: `beta`

**Files modified:**

| File | Change | Why |
|---|---|---|
| `package.json` | `devEngines` → `engines`; `build.publish.owner: EmuDeck → ygordreyer` | npm 11 rejects the `devEngines` string format; publish target must be our fork |
| `src/main/main.ts` | `dragoonDorise/EmuDeck.git` → `ygordreyer/EmuDeck.git` (4 occurrences) | App must clone our backend fork that has the macOS fixes |
| `release/app/package.json` | `version: 2.5.0 → 2.5.1` | New release version |
| `.github/workflows/build-beta.yml` | Added `publish-mac` job; disabled Linux/Windows jobs; added `workflow_dispatch` | CI must build the macOS .dmg |
| `README.md` | Full rewrite with macOS focus | Documentation |

**CRITICAL — package.json `publish.repo` field:**  
> ⚠️ Keep `build.publish.repo` set to `"emudeck-electron"` (NOT `"emudeck-electron-beta"`)!  
> The `Set Beta Build` CI step runs `sed -i "s|emudeck-electron|emudeck-electron-beta|g" "./package.json"` which appends `-beta` at build time.  
> If you pre-set it to `emudeck-electron-beta`, the sed step will make it `emudeck-electron-beta-beta` → 404 error when publishing.

**Dependabot PRs merged (all 6):**

| PR | Dependency | Notes |
|---|---|---|
| #30 | `@babel/runtime` 7.25.6 → 7.26.10 | Safe |
| #31 | `cookie` + `express` | Security patch |
| #32 | `react-router` + `react-router-dom` | Safe |
| #33 | `http-proxy-middleware` 2.0.6 → 2.0.9 | Safe |
| #34 | `webpack-dev-server` v4 → v5 | Major — build verified, no breaking config changes |
| #35 | `electron` v22 → v37 | Major — merged cleanly, build verified |

All PRs were fetched as `git fetch upstream "+refs/pull/N/head:pr-N"` and merged with `git merge --no-ff -X theirs`.

---

### 2. Backend Fork (ygordreyer/EmuDeck)

#### Branches: `main` and `early`

**Branch:** `mac-support` (merged into both `main` and `early`)

**Files modified:**

#### `setup.sh` — Enhanced Darwin block (lines 12–49)

The original had a basic PATH fix for gnu-sed. We expanded it to:

```bash
#Darwin
appleChip=$(uname -m)
if [ "$(uname)" != "Linux" ]; then
    # Auto-install gnu-sed via Homebrew if not already present
    if ! command -v gsed >/dev/null 2>&1; then
        if command -v brew >/dev/null 2>&1; then
            echo "[EmuDeck] Installing gnu-sed (required on macOS)..."
            brew install gnu-sed || { echo "ERROR: brew install gnu-sed failed."; exit 1; }
        else
            echo "ERROR: Homebrew is required on macOS. Install from https://brew.sh and re-run."
            exit 1
        fi
    fi
    if [ "$appleChip" = 'arm64' ]; then
        PATH="/opt/homebrew/opt/gnu-sed/libexec/gnubin:$PATH"
    else
        PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
    fi
    export PATH

    # Pre-seed ~/emudeck/settings.sh with macOS defaults if the file is missing or empty
    mkdir -p "$HOME/emudeck"
    if [ ! -s "$HOME/emudeck/settings.sh" ]; then
        cat > "$HOME/emudeck/settings.sh" <<'DARWIN_SETTINGS'
system="darwin"
Home="$HOME"
emulationPath="$HOME/Emulation"
romsPath="$HOME/Emulation/roms"
toolsPath="$HOME/Emulation/tools"
biosPath="$HOME/Emulation/bios"
savesPath="$HOME/Emulation/saves"
storagePath="$HOME/Emulation/storage"
DARWIN_SETTINGS
    fi

    # Decky Loader is Linux/SteamOS-only — disable on macOS
    doInstallRetroLibrary=false
fi
```

**Why:** Without this, `setup.sh` would fail to write `settings.sh` (BSD `sed` rejects GNU-specific `$a\` append syntax), causing the entire script to default to root paths that trigger SIP walls.

#### `functions/helperFunctions.sh` — `getProductName()` fix (line 95)

Original:
```bash
function getProductName(){
    cat /sys/devices/virtual/dmi/id/product_name
}
```

Fixed:
```bash
function getProductName(){
    # Linux-only DMI probe — return empty string on macOS/Darwin to avoid errors
    if [ "$(uname)" = "Linux" ]; then
        cat /sys/devices/virtual/dmi/id/product_name 2>/dev/null || true
    fi
}
```

**Why:** `/sys/devices/virtual/dmi/id/` doesn't exist on the XNU/Darwin kernel. This function returning empty on Darwin means `testRealDeck()` correctly sets `isRealDeck=false`.

---

## CI/CD Setup

### `.github/workflows/build-beta.yml`

```yaml
name: Publish
on:
  push:
    branches: [beta]
  workflow_dispatch:        # ← allows manual trigger from GitHub UI or API

jobs:
  publish-mac:
    runs-on: macos-latest
    steps:
      # ... checkout, submodules, node setup ...
      - name: Install gnu-sed
        run: brew install gnu-sed
      - name: Set Beta Build
        run: |
          export PATH="$(brew --prefix)/opt/gnu-sed/libexec/gnubin:$PATH"
          sed -i "s|main|beta|g" "./src/data/branch.json"
          sed -i "s|emudeck-electron|emudeck-electron-beta|g" "./package.json"
      - name: Publish releases
        env:
          CSC_IDENTITY_AUTO_DISCOVERY: false   # ← unsigned build, no Apple cert
          GH_TOKEN: ${{ secrets.github_token }}
        run: |
          npm run postinstall
          npm run build
          npm exec electron-builder -- --publish always --mac
```

The build produces (arm64 + x64):
- `EmuDeck-2.5.1-arm64.dmg`
- `EmuDeck-2.5.1.dmg`
- `EmuDeck-2.5.1-arm64-mac.zip`
- `EmuDeck-2.5.1-mac.zip`
- `latest-mac.yml` (for auto-updater)

### How to manually trigger CI

```bash
curl -X POST \
  -H "Authorization: token YOUR_PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/ygordreyer/emudeck-electron-beta/actions/workflows/build-beta.yml/dispatches" \
  -d '{"ref":"beta"}'
```

---

## Known Issues & Gotchas

### 1. Double-beta repo name (FIXED)
`build.publish.repo` in `package.json` must stay as `"emudeck-electron"`. The CI `Set Beta Build` sed step will convert it to `"emudeck-electron-beta"` at build time. If you pre-set it to `"emudeck-electron-beta"`, the sed step creates `"emudeck-electron-beta-beta"` → 404.

### 2. Unsigned Mac build
Users will see a Gatekeeper warning on first launch. Fix:
```bash
xattr -cr /Applications/EmuDeck.app
```

### 3. npm 11 + `devEngines` field
npm 11 rejects the plain string format for `devEngines`. Converted to standard `engines` field. If you restore the `devEngines` field, you must use the npm 11 object format: `{"version": ">=14.x"}` not just `">=14.x"`.

### 4. Electron v22 → v37 (merged)
This is a huge version jump. The build currently passes, but there may be runtime issues with deprecated APIs (`enableRemoteModule`, contextIsolation defaults, etc.) that only surface at runtime rather than build time. If the app misbehaves, reverting PR #35 is the rollback.

### 5. Backend URL in `src/main/main.ts`
There are **4 occurrences** of the backend git URL in `main.ts`. All have been changed from `dragoonDorise/EmuDeck.git` to `ygordreyer/EmuDeck.git`. If upstream adds more clone commands, they'll still point to upstream.

---

## File Tree of Changed Files

```
~/Desktop/emudeck-work/
├── emudeck-electron-beta/           ← ygordreyer/emudeck-electron-beta
│   ├── .github/workflows/
│   │   └── build-beta.yml           ← mac CI job only; Linux/Win disabled
│   ├── src/main/
│   │   └── main.ts                  ← backend URL → ygordreyer/EmuDeck.git
│   ├── release/app/
│   │   └── package.json             ← version: 2.5.1
│   ├── package.json                 ← devEngines→engines; publish.owner→ygordreyer
│   ├── README.md                    ← this fork's README (macOS focus)
│   └── AI-SESSION-NOTES.md          ← this file
│
└── emudeck-backend/                 ← ygordreyer/EmuDeck
    ├── setup.sh                     ← expanded Darwin block
    └── functions/
        └── helperFunctions.sh       ← getProductName() Darwin fix
```

---

## Git History Summary (Electron Fork, `beta` branch)

```
2bec07e fix: revert publish.repo to emudeck-electron (double-beta bug fix)
eb11310 ci: add workflow_dispatch trigger to build-beta.yml
6351c2f feat: add macOS CI job, bump version to 2.5.1, update publish target to fork
a57c4c3 fix: point backend clone to ygordreyer/EmuDeck fork with macOS fixes
ba3fa63 fix: convert devEngines to engines for npm 11 compatibility
3132c00 Merge PR #35 from upstream (Dependabot: electron v37)
4c160f9 Merge PR #34 from upstream (Dependabot: webpack-dev-server v5)
a012a43 Merge PR #32 from upstream (Dependabot)
17047e2 Merge PR #33 from upstream (Dependabot)
d2b5a71 Merge PR #31 from upstream (Dependabot)
916e93c Merge PR #30 from upstream (Dependabot)
220b298 2.5.0                         ← upstream base
```

## Git History Summary (Backend Fork, `main` branch)

```
c6f82268 Merge mac-support: macOS portability fixes
85f929e2 feat(mac): auto-install gnu-sed, seed settings.sh, guard DMI probe, disable Decky on Darwin
ca280cf5 ...upstream base...
```

---

## How to Continue / Next Steps

### If CI is still building
Check status:
```bash
curl -s -H "Authorization: token YOUR_PAT" \
  "https://api.github.com/repos/ygordreyer/emudeck-electron-beta/actions/runs?per_page=3" | \
  jq '.workflow_runs[] | {id, status, conclusion, created_at}'
```

### If you need to make more backend fixes
```bash
cd ~/Desktop/emudeck-work/emudeck-backend
git checkout -b my-fix main
# make changes
git commit -am "fix: ..."
git push origin my-fix
# merge to main + cherry-pick to early
git checkout main && git merge --no-ff my-fix && git push
git checkout early && git merge --no-ff my-fix && git push
```

### If you need to rebuild the Electron app
```bash
cd ~/Desktop/emudeck-work/emudeck-electron-beta
# make changes to beta branch
git commit -am "fix: ..."
git push origin beta
# CI triggers automatically on push to beta
```

### If you need a new release version (e.g. 2.5.2)
```bash
# Edit release/app/package.json version field
# Commit and push to beta
# CI will create a new tagged release
```

---

## PAT Security Note

> ⚠️ The GitHub PAT used in this session (`ghp_9pK...`) was shared in chat and should be **revoked immediately** at:
> https://github.com/settings/tokens
>
> Generate a new PAT with only the scopes you need:
> - `repo` (for pushing to repos and creating releases)
> - `workflow` (for triggering/reading Actions)

---

## Links

| Resource | URL |
|---|---|
| Electron fork | https://github.com/ygordreyer/emudeck-electron-beta |
| Backend fork | https://github.com/ygordreyer/EmuDeck |
| Releases | https://github.com/ygordreyer/emudeck-electron-beta/releases |
| CI workflow | https://github.com/ygordreyer/emudeck-electron-beta/actions |
| Upstream Electron | https://github.com/EmuDeck/emudeck-electron-beta |
| Upstream Backend | https://github.com/dragoonDorise/EmuDeck |
