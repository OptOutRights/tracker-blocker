export const GPC_HEADER_NAME = "Sec-GPC";
export const DNT_HEADER_NAME = "DNT";

const PRIVACY_SIGNAL_HEADER_NAMES = new Set([
  GPC_HEADER_NAME.toLowerCase(),
  DNT_HEADER_NAME.toLowerCase(),
]);

export function applyPrivacySignalHeaders(
  requestHeaders: Browser.webRequest.HttpHeader[],
): Browser.webRequest.HttpHeader[] {
  const withoutExisting = requestHeaders.filter(
    (header) => !PRIVACY_SIGNAL_HEADER_NAMES.has(header.name.toLowerCase()),
  );

  return [
    ...withoutExisting,
    { name: GPC_HEADER_NAME, value: "1" },
    { name: DNT_HEADER_NAME, value: "1" },
  ];
}
