import assert from "node:assert/strict";
import { createServer } from "node:http";
import { By } from "selenium-webdriver";
import { launchWithExtension, openPopup } from "./lib.mjs";

// All traffic stays on loopback; native Firefox signals are disabled so they
// cannot mask a missing extension header or content-script registration.
const requests = [];
const server = createServer((request, response) => {
  requests.push({ url: request.url, headers: request.headers });
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "no-store");
  if (request.url.startsWith("/echo")) {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(request.headers));
  } else if (request.url === "/worker.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(`onmessage = async () => postMessage(await (await fetch('/echo?worker')).json());`);
  } else {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><title>GPC fixture</title>
      <script>window.earlyGpc = navigator.globalPrivacyControl;</script>
      ${request.url === "/" ? `<iframe id="cross" src="http://127.0.0.1:${server.address().port}/frame"></iframe><iframe id="inherited" srcdoc="<script>window.earlyGpc = navigator.globalPrivacyControl;</script>"></iframe>` : ""}`);
  }
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const base = `http://localhost:${server.address().port}`;
let session;
try {
  session = await launchWithExtension({ preferences: {
    "privacy.globalprivacycontrol.enabled": false,
    "privacy.donottrackheader.enabled": false,
  } });
  const { driver, uuid } = session;
  await driver.manage().setTimeouts({ script: 15000, pageLoad: 15000 });
  await driver.get(base);
  async function assertPageSignal(label) {
    const result = await driver.executeScript(`
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'globalPrivacyControl');
      try { Object.defineProperty(navigator, 'globalPrivacyControl', { value: false }); } catch {}
      try { delete navigator.globalPrivacyControl; } catch {}
      try { navigator.globalPrivacyControl = false; } catch {}
      return { early: window.earlyGpc, value: navigator.globalPrivacyControl,
        configurable: descriptor?.configurable, writable: descriptor?.writable };
    `);
    assert.deepEqual(result, { early: true, value: true, configurable: false, writable: false }, label);
    console.log(`PASS ${label}`);
  }
  await assertPageSignal("top frame at document_start and override protection");
  for (const id of ["cross", "inherited"]) {
    await driver.switchTo().frame(await driver.findElement(By.id(id)));
    await assertPageSignal(`${id} iframe`);
    await driver.switchTo().defaultContent();
  }
  const workerHeaders = await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    const worker = new Worker('/worker.js');
    worker.onmessage = event => { worker.terminate(); done(event.data); };
    worker.onerror = event => { worker.terminate(); done({ error: event.message }); };
    worker.postMessage('go');
  `);
  assert.equal(workerHeaders["sec-gpc"], "1");
  assert.equal(workerHeaders.dnt, undefined);
  console.log("PASS worker request headers");
  await openPopup(driver, uuid);
  async function extensionProbe(label) {
    const result = await driver.executeAsyncScript(`
      const url = arguments[0], done = arguments[arguments.length - 1];
      let tabId;
      const observe = details => { if (details.url === url) tabId = details.tabId; };
      browser.webRequest.onBeforeSendHeaders.addListener(observe, { urls: ['<all_urls>'] });
      browser.runtime.getBackgroundPage().then(bg => bg.fetch(url))
        .then(response => response.json()).then(headers => done({ headers, tabId }))
        .catch(error => done({ error: String(error) }))
        .finally(() => browser.webRequest.onBeforeSendHeaders.removeListener(observe));
    `, `${base}/echo?${label}`);
    assert.equal(result.tabId, -1, JSON.stringify(result));
    assert.equal(result.headers["sec-gpc"], "1");
    assert.equal(result.headers.dnt, undefined);
    console.log(`PASS ${label}: background request with tabId -1`);
  }
  await extensionProbe("normal");
  for (const action of ["allow", "block"]) {
    const override = await driver.executeAsyncScript(`
      const action = arguments[0], done = arguments[arguments.length - 1];
      browser.runtime.sendMessage({ type: 'trackerblocker.setDomainOverride', domain: 'localhost', action }).then(done);
    `, action);
    assert.equal(override.type, "trackerblocker.settingsResponse");
    await extensionProbe(`${action}-override`);
  }
  const pause = await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    browser.runtime.sendMessage({ type: 'trackerblocker.updateSitePause', site: 'localhost', mode: 'always' }).then(done);
  `);
  assert.equal(pause.type, "trackerblocker.settingsResponse");
  await extensionProbe("paused");
  await driver.get(`${base}/?paused`);
  const headers = await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    fetch('/echo?paused-page').then(response => response.json()).then(done);
  `);
  assert.equal(headers["sec-gpc"], "1");
  assert.equal(headers.dnt, undefined);
  for (const request of requests) {
    assert.equal(request.headers["sec-gpc"], "1", request.url);
    assert.equal(request.headers.dnt, undefined, request.url);
  }
  console.log(`PASS all ${requests.length} fixture requests carry GPC without added DNT`);
} finally {
  await session?.close();
  await new Promise(resolve => server.close(resolve));
}
