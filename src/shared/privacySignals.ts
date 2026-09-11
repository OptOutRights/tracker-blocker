export const GPC_HEADER_NAME = "Sec-GPC";

const GPC_HEADER_NAME_LOWERCASE = GPC_HEADER_NAME.toLowerCase();

export function applyPrivacySignalHeaders(
  requestHeaders: Browser.webRequest.HttpHeader[],
): Browser.webRequest.HttpHeader[] {
  return [
    ...requestHeaders.filter(
      (header) => header.name.toLowerCase() !== GPC_HEADER_NAME_LOWERCASE,
    ),
    { name: GPC_HEADER_NAME, value: "1" },
  ];
}
