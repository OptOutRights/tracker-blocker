import { describe, expect, it } from "vitest";

import {
  applyPrivacySignalHeaders,
  GPC_HEADER_NAME,
} from "./privacySignals";

describe("privacy signal headers", () => {
  it("preserves a browser-supplied DNT preference without adding its own", () => {
    expect(applyPrivacySignalHeaders([{ name: "DNT", value: "1" }])).toEqual([
      { name: "DNT", value: "1" },
      { name: GPC_HEADER_NAME, value: "1" },
    ]);
  });
  it("adds a GPC header to a request with no existing signal headers", () => {
    const result = applyPrivacySignalHeaders([
      { name: "Accept", value: "application/json" },
    ]);

    expect(result).toEqual([
      { name: "Accept", value: "application/json" },
      { name: GPC_HEADER_NAME, value: "1" },
    ]);
  });

  it("replaces an existing GPC header rather than duplicating it", () => {
    const result = applyPrivacySignalHeaders([
      { name: "sec-gpc", value: "0" },
      { name: "Accept", value: "text/html" },
    ]);

    expect(result).toEqual([
      { name: "Accept", value: "text/html" },
      { name: GPC_HEADER_NAME, value: "1" },
    ]);
  });

  it("returns only the GPC header for an empty request", () => {
    expect(applyPrivacySignalHeaders([])).toEqual([
      { name: GPC_HEADER_NAME, value: "1" },
    ]);
  });
});
