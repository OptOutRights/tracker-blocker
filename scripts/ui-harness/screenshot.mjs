import { writeFile } from "node:fs/promises";

import { launchWithExtension, openExtensionPage, openPopup } from "./lib.mjs";

const outputPath = process.argv[2];
const page = process.argv[3] ?? "popup.html";

const { close, driver, uuid } = await launchWithExtension({ headless: true });

try {
  if (page === "popup.html") {
    await driver.manage().window().setRect({ width: 380, height: 560 });
    await openPopup(driver, uuid);
  } else {
    await driver.manage().window().setRect({ width: 720, height: 800 });
    await openExtensionPage(driver, uuid, page);
  }
  await driver.sleep(1000);
  const data = await driver.takeScreenshot();
  await writeFile(outputPath, Buffer.from(data, "base64"));
  process.stdout.write(`Saved ${outputPath}\n`);
} finally {
  await close();
}
