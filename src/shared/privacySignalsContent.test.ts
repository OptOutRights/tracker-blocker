import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ContentScriptDefinition = {
  allFrames: boolean;
  main: () => void;
  matchOriginAsFallback: boolean;
  matches: string[];
  runAt: string;
  world: string;
};

let definition: ContentScriptDefinition;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("navigator", {});
  vi.stubGlobal(
    "defineContentScript",
    (contentScript: ContentScriptDefinition) => contentScript,
  );
  definition = (await import("../entrypoints/privacySignals.content"))
    .default as ContentScriptDefinition;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("privacy signals content script", () => {
  it("registers for every frame, including inherited-origin frames", () => {
    expect(definition).toMatchObject({
      allFrames: true,
      matchOriginAsFallback: true,
      matches: ["<all_urls>"],
      runAt: "document_start",
      world: "MAIN",
    });
  });

  it("installs a non-configurable GPC value", () => {
    definition.main();

    const browserNavigator = navigator as Navigator & {
      globalPrivacyControl: boolean;
    };
    expect(browserNavigator.globalPrivacyControl).toBe(true);
    expect(
      Object.getOwnPropertyDescriptor(navigator, "globalPrivacyControl"),
    ).toMatchObject({
      configurable: false,
      enumerable: true,
      value: true,
      writable: false,
    });
  });
});
