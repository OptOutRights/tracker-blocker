export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  matchOriginAsFallback: true,
  world: "MAIN",
  runAt: "document_start",
  main() {
    try {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        configurable: false,
        enumerable: true,
      });
    } catch {
      return;
    }
  },
});
