# EmuDeck for macOS — Community Fork

[![Fork of EmuDeck](https://img.shields.io/badge/fork%20of-EmuDeck%2Femudeck--electron--beta-blue)](https://github.com/EmuDeck/emudeck-electron-beta)
[![macOS](https://img.shields.io/badge/platform-macOS%20(arm64%20%7C%20x64)-brightgreen)](https://github.com/ygordreyer/emudeck-electron-beta/releases)
[![Release](https://img.shields.io/github/v/release/ygordreyer/emudeck-electron-beta)](https://github.com/ygordreyer/emudeck-electron-beta/releases/latest)

<img src="https://www.emudeck.com/img/hero.png">

> **This is an unofficial community fork** of [EmuDeck/emudeck-electron-beta](https://github.com/EmuDeck/emudeck-electron-beta), maintained by [@ygordreyer](https://github.com/ygordreyer) with a primary focus on **macOS support**.
>
> The upstream v2.5.0 release only shipped Linux and Windows builds. This fork restores macOS builds and applies compatibility fixes for running EmuDeck on macOS.

---

## 🍎 macOS — What's Fixed

The upstream EmuDeck backend (`dragoonDorise/EmuDeck`) has several Linux/SteamOS-specific assumptions that break on macOS. This fork includes patches to the backend repo ([ygordreyer/EmuDeck](https://github.com/ygordreyer/EmuDeck)) that handle:

| Issue | Fix |
|---|---|
| BSD `sed` rejects GNU `$a\` append syntax | Auto-install `gnu-sed` via Homebrew; prepend gnubin to `$PATH` |
| `~/emudeck/settings.sh` missing → defaults to `/yuzu`, `/launchers` | Pre-seed the settings file with correct macOS paths on first run |
| `cp` fails: script assumes CWD is backend dir | Anchor CWD to backend directory on Darwin |
| `Plugins_installDeckyRomLibrary` fatal-errors (needs systemd + CEF) | Guard with `[[ "$(uname -s)" != "Darwin" ]]` — skipped on macOS |
| `/sys/devices/virtual/dmi/id/product_name` doesn't exist on Darwin | `getProductName()` returns empty string on macOS; `testRealDeck()` sets `isRealDeck=false` |
| Only RetroArch appeared in the "Manage Emulators" screen on macOS | Added macOS allowlist (`MAC_EMUS` Set) in `ManageEmulatorsPage.jsx`; all 16 supported emulators now visible |
| Downloaded apps show "App is damaged" Gatekeeper error | `mac_install_zip/dmg/targz/7z`: `xattr -cr` before extraction + `ditto` instead of `cp -R`; `hdiutil -noverify -noautoopen` |

### macOS Prerequisites

Before first launch:
1. Install [Homebrew](https://brew.sh) (if not already installed)
2. The app will auto-install `gnu-sed` on first run if it's missing

### First-run Quarantine Warning

Because this is an **unsigned build**, macOS will quarantine it. Run this once after installing:

```bash
xattr -cr /Applications/EmuDeck.app
```

---

## 📦 Downloads (v2.5.2)

Go to [Releases](https://github.com/ygordreyer/emudeck-electron-beta/releases/latest) and download:

| File | Platform |
|---|---|
| `EmuDeck-2.5.2-arm64.dmg` | macOS Apple Silicon (M1/M2/M3/M4) |
| `EmuDeck-2.5.2.dmg` | macOS Intel (x64) |
| `EmuDeck-2.5.2-arm64-mac.zip` | macOS Apple Silicon (portable zip) |
| `EmuDeck-2.5.2-mac.zip` | macOS Intel (portable zip) |

---

## 🔀 Changes from Upstream

This fork is based on `EmuDeck/emudeck-electron-beta` at tag `v2.5.0` with the following additions:

### v2.5.2
- **macOS emulator allowlist** — 16 emulators now visible in the Manage page (was only RetroArch)
- **Quarantine fix** — `ditto` + `xattr -cr` before extraction eliminates "App is damaged" errors
- **Cemu** — Rosetta 2 note logged when installing on Apple Silicon

### v2.5.1
- **All 6 pending Dependabot PRs merged** (#30–#35):
  - `@babel/runtime` 7.25.6 → 7.26.10
  - `cookie` + `express` security patches
  - `http-proxy-middleware` 2.0.6 → 2.0.9
  - `react-router` + `react-router-dom` bumped
  - `webpack-dev-server` v4 → v5
  - `electron` v22 → v37
- **npm 11 compatibility**: `devEngines` field converted to standard `engines`
- **macOS CI job** added to GitHub Actions (`build-beta.yml`)
- **Backend fork**: Electron app now clones [ygordreyer/EmuDeck](https://github.com/ygordreyer/EmuDeck) which has all macOS patches applied

---

## 🛠 Building from Source

```bash
git clone --recurse-submodules https://github.com/ygordreyer/emudeck-electron-beta.git
cd emudeck-electron-beta
npm ci
npm run build
npm exec electron-builder -- --mac   # for macOS
```

> Requires: Node 20.x, npm 9+, `brew install gnu-sed` on macOS

---

## ⚠️ Disclaimer

This is a community fork and is **not officially supported by the EmuDeck team**. For official support, use the upstream releases from [emudeck.com](https://www.emudeck.com).

For issues specific to macOS in this fork, open an issue at [ygordreyer/emudeck-electron-beta/issues](https://github.com/ygordreyer/emudeck-electron-beta/issues).

---

## Original Project

EmuDeck is a collection of scripts that allows you to autoconfigure your Steam Deck. It creates your roms directory structure and downloads all of the needed Emulators for you along with the best configurations for each of them. EmuDeck works great with [Steam Rom Manager](https://github.com/SteamGridDB/steam-rom-manager) or with [EmulationStation DE](https://es-de.org).

---

## Open Emoji

All emojis designed by [OpenMoji](https://openmoji.org/) – the open-source emoji and icon project. License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/#)
