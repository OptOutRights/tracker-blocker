import assert from "node:assert/strict";

import { By, Key, until } from "selenium-webdriver";

import { launchWithExtension, openPopup } from "./lib.mjs";

const checkpoints = [];

const HEADLESS = process.env.UI_HARNESS_HEADLESS !== "false";

async function main() {
  const { close, driver, uuid } = await launchWithExtension({ headless: HEADLESS });

  try {
    await openPopup(driver, uuid);
    await driver.wait(until.elementLocated(By.css("body")), 5000);
    const heading = await driver.findElement(
      By.xpath("//p[contains(text(), 'Tracker Blocker')]"),
    );
    assert.ok(await heading.isDisplayed());
    checkpoint("popup renders the Tracker Blocker heading");

    const bodyText = await driver.findElement(By.css("body")).getText();
    assert.ok(bodyText.length > 0);
    checkpoint("popup body is non-empty in its normal state");

    await driver.executeScript(
      "document.activeElement?.blur(); document.body.setAttribute('tabindex', '-1'); document.body.focus();",
    );
    let reachedSettingsButton = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await driver.actions().sendKeys(Key.TAB).perform();
      const activeLabel = await driver.executeScript(
        "return document.activeElement ? document.activeElement.getAttribute('aria-label') : null;",
      );
      if (activeLabel === "Open Tracker Blocker settings") {
        reachedSettingsButton = true;
        break;
      }
    }
    assert.ok(
      reachedSettingsButton,
      "settings button was not reachable via keyboard Tab navigation",
    );
    checkpoint("settings button is reachable via keyboard Tab navigation");

    await driver.manage().window().setRect({ width: 320, height: 480 });
    await openPopup(driver, uuid);
    await driver.wait(until.elementLocated(By.css("body")), 5000);
    const narrowHeading = await driver.findElement(
      By.xpath("//p[contains(text(), 'Tracker Blocker')]"),
    );
    assert.ok(await narrowHeading.isDisplayed());
    const scrollWidth = await driver.executeScript(
      "return document.documentElement.scrollWidth;",
    );
    const clientWidth = await driver.executeScript(
      "return document.documentElement.clientWidth;",
    );
    assert.ok(
      scrollWidth <= clientWidth + 1,
      `popup overflows horizontally at 320px width (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`,
    );
    checkpoint("popup has no horizontal overflow at 320px width");

    if (!HEADLESS) {
      await driver.manage().window().setRect({ width: 400, height: 600 });
      await openPopup(driver, uuid);
      await driver.sleep(8000);
    }
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
  process.stdout.write("\nUI harness report\n");
  process.stdout.write(`Checkpoints passed: ${checkpoints.length}\n`);
  for (const name of checkpoints) process.stdout.write(`- ${name}\n`);
}

await main();
