/**
 * scripts/macAdHocSign.js
 *
 * electron-builder afterPack hook.
 * Ad-hoc signs the macOS .app bundle with a local self-signed identity ("-").
 *
 * Why: On Apple Silicon, an unsigned Electron app triggers a hard Gatekeeper
 * block ("App is damaged and can't be opened"). Ad-hoc signing satisfies the
 * code-signature requirement without needing a paid Apple Developer account.
 *
 * After ad-hoc signing, users may still see "developer cannot be verified" on
 * first launch — the workaround is right-click → Open, or:
 *   xattr -cr /Applications/EmuDeck.app
 *
 * This hook runs after files are packed but before the DMG/zip is created,
 * so the signature is embedded in the final distributable.
 */

'use strict';

const { execSync } = require('node:child_process');
const path = require('node:path');

/**
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function afterPack(context) {
  // Only run on macOS builds
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  console.log(`\n[macAdHocSign] Ad-hoc signing: ${appPath}`);

  try {
    // Remove any existing signature first (avoids conflicts)
    execSync(
      `codesign --remove-signature "${appPath}" 2>/dev/null || true`,
      { stdio: 'inherit' }
    );

    // Ad-hoc sign the entire .app bundle recursively
    // --force:   overwrite existing signature
    // --deep:    sign all nested frameworks and helpers
    // --sign -:  use the ad-hoc identity (no certificate required)
    execSync(
      `codesign --force --deep --sign - "${appPath}"`,
      { stdio: 'inherit' }
    );

    // Verify the signature
    execSync(
      `codesign -dv --verbose=2 "${appPath}"`,
      { stdio: 'pipe' }
    );

    console.log('[macAdHocSign] ✅ Ad-hoc signing complete.\n');
  } catch (err) {
    // Log but don't fail the build — an unsigned app can still be opened
    // by the user via right-click → Open or xattr -cr.
    console.error(`[macAdHocSign] ⚠ codesign failed (non-fatal): ${err.message}`);
  }
};
