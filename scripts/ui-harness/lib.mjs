import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
export const PROJECT_ROOT = resolve(SCRIPT_DIR, "../..");
export const EXTENSION_SOURCE = process.env.UI_HARNESS_EXTENSION_SOURCE
  ? resolve(process.env.UI_HARNESS_EXTENSION_SOURCE)
  : resolve(PROJECT_ROOT, ".output/firefox-mv3");
export const EXTENSION_NAME = "Tracker Blocker by Opt Out Rights";
export const EXTENSION_ID = "trackerblocker@optoutrights.org";

export async function verifyBuild() {
  const manifest = JSON.parse(
    await readFile(resolve(EXTENSION_SOURCE, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.name, EXTENSION_NAME);
  assert.equal(manifest.browser_specific_settings?.gecko?.id, EXTENSION_ID);
}

const CANDIDATE_FIREFOX_BINARIES = {
  win32: [
    "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
  ],
  darwin: ["/Applications/Firefox.app/Contents/MacOS/firefox"],
  linux: ["/usr/bin/firefox", "/usr/lib/firefox/firefox", "/snap/bin/firefox"],
};

export function resolveFirefoxBinary() {
  if (process.env.FIREFOX_BINARY) {
    return process.env.FIREFOX_BINARY;
  }

  const candidates = CANDIDATE_FIREFOX_BINARIES[process.platform] ?? [];
  const installed = candidates.find((candidate) => existsSync(candidate));
  if (installed) {
    return installed;
  }

  return "firefox";
}

export function resolveGeckoDriverPath() {
  const driverPath = process.env.GECKODRIVER_PATH;

  if (!driverPath) {
    throw new Error(
      "UI harness requires a local geckodriver binary. Set GECKODRIVER_PATH to its absolute path; the test suite never downloads a driver at runtime.",
    );
  }

  if (!existsSync(driverPath)) {
    throw new Error(`GECKODRIVER_PATH does not exist: ${driverPath}`);
  }

  return driverPath;
}

export async function launchWithExtension({ headless = true } = {}) {
  await verifyBuild();

  const options = new firefox.Options();
  options.setBinary(resolveFirefoxBinary());
  if (headless) {
    options.addArguments("-headless");
  }

  const service = new firefox.ServiceBuilder(resolveGeckoDriverPath()).addArguments(
    "--allow-system-access",
  );
  let driver;
  try {
    driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .setFirefoxService(service)
      .build();

    await driver.installAddon(EXTENSION_SOURCE, true);
    await delay(1000);
    const uuid = await resolveExtensionUuid(driver);

    return {
      driver,
      uuid,
      async close() {
        await driver.quit();
      },
    };
  } catch (error) {
    await driver?.quit().catch(() => undefined);
    throw error;
  }
}

export async function resolveExtensionUuid(driver) {
  const capabilities = await driver.getCapabilities();
  const profilePath = capabilities.get("moz:profile");
  const prefsText = readFileSync(resolve(profilePath, "prefs.js"), "utf8");
  const match = prefsText.match(
    /user_pref\("extensions\.webextensions\.uuids", "(.*?)"\);/,
  );
  assert.ok(match, "extensions.webextensions.uuids pref was not written");
  const uuidMap = JSON.parse(match[1].replace(/\\"/g, '"'));
  const uuid = uuidMap[EXTENSION_ID];
  assert.ok(uuid, `no moz-extension uuid recorded for ${EXTENSION_ID}`);
  return uuid;
}

export async function openPopup(driver, uuid) {
  await openExtensionPage(driver, uuid, "popup.html");
}

export async function openExtensionPage(driver, uuid, page) {
  const url = `moz-extension://${uuid}/${page}`;
  await driver.setContext(firefox.Context.CONTENT);
  await driver.get(url);
  await driver.wait(
    async () => (await driver.getCurrentUrl()).startsWith(url),
    5000,
  );
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}
