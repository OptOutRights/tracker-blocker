export default defineContentScript({
  matches: ["<all_urls>"],
  world: "MAIN",
  runAt: "document_start",
  main() {
    try {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      return;
    }
  },
});
