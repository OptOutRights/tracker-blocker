import assert from "node:assert/strict";

import { By, Key, until } from "selenium-webdriver";

import { launchWithExtension, openExtensionPage } from "./lib.mjs";

const EXPECT_ENGINE_HEALTHY = process.env.EXPECT_ENGINE_HEALTHY !== "false";

const checkpoints = [];

async function main() {
  const { close, driver, uuid } = await launchWithExtension({ headless: true });

  try {
    await openExtensionPage(driver, uuid, "options.html");

    const summary = await driver.wait(
      until.elementLocated(
        By.xpath("//summary[contains(., 'System diagnostics')]"),
      ),
      5000,
    );
    checkpoint("options page renders the diagnostics disclosure");

    await summary.sendKeys(Key.RETURN);

    const engineRow = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//dt[contains(., 'Filtering engine')]/following-sibling::dd",
        ),
      ),
      5000,
    );
    const siteAccessRow = await driver.findElement(
      By.xpath("//dt[contains(., 'Site access')]/following-sibling::dd"),
    );

    const engineText = await engineRow.getText();
    const siteAccessText = await siteAccessRow.getText();

    if (EXPECT_ENGINE_HEALTHY) {
      assert.equal(engineText, "ready");
      checkpoint("filtering engine reports ready");
    } else {
      assert.match(engineText, /degraded/);
      checkpoint("filtering engine reports degraded");
    }

    assert.equal(siteAccessText, "Granted");
    checkpoint("site access reports granted");
  } finally {
    await close();
  }

  report();
}

function checkpoint(name) {
  checkpoints.push(name);
  process.stdout.write(`PASS ${name}\n`);
}

function report() {
  process.stdout.write("\nUI harness report (options)\n");
  process.stdout.write(`Checkpoints passed: ${checkpoints.length}\n`);
  for (const name of checkpoints) process.stdout.write(`- ${name}\n`);
}

await main();
