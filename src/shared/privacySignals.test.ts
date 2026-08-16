import { describe, expect, it } from "vitest";

import {
  applyPrivacySignalHeaders,
  DNT_HEADER_NAME,
  GPC_HEADER_NAME,
} from "./privacySignals";

describe("privacy signal headers", () => {
  it("adds GPC and DNT headers to a request with no existing signal headers", () => {
    const result = applyPrivacySignalHeaders([
      { name: "Accept", value: "application/json" },
    ]);

    expect(result).toEqual([
      { name: "Accept", value: "application/json" },
      { name: GPC_HEADER_NAME, value: "1" },
      { name: DNT_HEADER_NAME, value: "1" },
    ]);
  });

  it("replaces existing GPC and DNT headers rather than duplicating them", () => {
    const result = applyPrivacySignalHeaders([
      { name: "sec-gpc", value: "0" },
      { name: "Dnt", value: "0" },
      { name: "Accept", value: "text/html" },
    ]);

    expect(result).toEqual([
      { name: "Accept", value: "text/html" },
      { name: GPC_HEADER_NAME, value: "1" },
      { name: DNT_HEADER_NAME, value: "1" },
    ]);
  });

  it("returns only the signal headers for an empty request", () => {
    expect(applyPrivacySignalHeaders([])).toEqual([
      { name: GPC_HEADER_NAME, value: "1" },
      { name: DNT_HEADER_NAME, value: "1" },
    ]);
  });
});
