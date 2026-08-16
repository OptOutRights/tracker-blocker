# Firefox QA

Use this checklist for user-visible or Firefox-runtime changes. Run against a
fresh profile using `npm run dev:firefox` or the built
`.output/firefox-mv3` extension.

## Automated Checks

```sh
npm run verify:easyprivacy
npm test
npm run typecheck
npm run lint:firefox
npm run zip:firefox
```

Run `npm run test:easyprivacy` when filter policy, request observation,
recovery, storage, permissions, performance, packaging, or Firefox lifecycle
behavior changes.

Run `npm run test:ui` for popup/options UI changes. It drives a real
Firefox build via Selenium/geckodriver with the packaged extension
sideloaded, and needs local Firefox and geckodriver binaries. Set
`GECKODRIVER_PATH` to the driver's absolute path; the harness deliberately
does not download a browser driver while testing. Set `FIREFOX_BINARY` to
point at a specific binary if the platform default in
`scripts/ui-harness/lib.mjs` doesn't find one (e.g. a non-standard
install path or a CI image).

## Browser Checklist

- Confirm a quiet first-party page produces a useful empty or near-empty state.
- On a content page, confirm request totals, host totals, rule-source counts,
  statuses, and local explanations agree.
- Confirm the badge counts blocked request attempts, not blocked hosts.
- After blocking requests, force-restart the MV3 background and confirm the
  popup and badge retain the same count when native document identifiers are
  available, or report the count unavailable on older Firefox versions.
- Confirm pushState and hash changes preserve the count, while full navigation,
  reload, pause, permission loss, and tab closure invalidate or reset it.
- On an `about:` or extension page, confirm the badge and popup report the
  blocked count unavailable rather than claiming an active zero.
- Confirm a mixed-use hostname retains separate blocked and allowed attempts.
- Expand representative attempts and inspect action, source, request type,
  scrubbed path hint, and EasyPrivacy rule or exception evidence.
- Use “Allow on this site,” refresh, and confirm the allow affects only that
  exact site and hostname.
- Confirm pause once survives refresh and worker restart, then clears on
  cross-site navigation and tab closure.
- Confirm pause always applies in another tab and remains removable.
- Confirm global Allow and Block overrides retain their documented precedence.
- On a host that served a stylesheet or font on the current page, choose a
  global Block override and confirm a warning appears with Cancel and Block
  anyway instead of applying immediately. Confirm Cancel leaves it unblocked
  and Block anyway applies it. Confirm a script- or beacon-only host still
  blocks immediately with no warning.
- Confirm a supported EasyPrivacy block is canceled, an exception is allowed,
  and an explicitly matched first-party subresource follows the filter result.
- Confirm an automatic EasyPrivacy `main_frame` match is not canceled, while an
  explicit user Block override can cancel a top-level hostname.
- Open Settings and confirm the heading and introduction appear immediately,
  “Loading saved rules…” appears before the first response, and no empty-rule
  claims appear until settings load successfully.
- When the initial settings request fails, confirm the page shows an alert,
  keeps the rule sections hidden, and “Retry loading” recovers after storage is
  available again. A diagnostics failure alone must not hide usable settings.
- Seed each saved-rule type and confirm Resume, Remove, and Restore automatic
  retain their complete target hostname, have target-specific accessible names,
  and disable together while any mutation is pending.
- When a settings mutation fails, confirm the last-known-good rules remain
  visible, the failure is announced, and retrying the same action remains
  possible.
- Confirm “Reset saved rules…” is disabled when no saved rules exist. With a
  saved rule, open its inline confirmation and verify that all three saved-rule
  types are named and tab-scoped “pause once” state is explicitly excluded.
- Cancel reset and confirm the saved rule remains both in storage and on the
  page. Reopen, confirm reset, and verify the confirmation closes, completion
  is announced, and all three empty messages appear.
- Navigate Settings using only the keyboard. Confirm retry, reset, confirmation,
  cancellation, and row controls follow a useful order and have a visible focus
  indicator; the reset trigger must expose its expanded state.
- At normal width and in a roughly 320-pixel-wide Firefox Add-ons Manager or
  browser window, confirm long domains, punycode values, and IP literals wrap
  completely without hiding or overlapping their action buttons.
- Expand System diagnostics and confirm the installed extension version appears
  separately from the EasyPrivacy provenance.
- At narrow popup widths, confirm controls remain usable without horizontal
  overflow and focus indicators remain visible.
- On Firefox 142 specifically, click the toolbar icon in a fresh profile and
  confirm the popup physically opens and reaches a settled protection state.
  The automated minimum-version matrix can test the packaged popup directly
  but cannot reliably observe this browser-chrome interaction.
- When a stress fixture exceeds a memory bound, confirm the popup discloses the
  relevant truncation rather than presenting bounded totals as complete.
- Before release, sample public content, commerce, login, and quiet first-party
  sites in a fresh profile. Compare any suspected regression with EasyPrivacy
  disabled, avoid credentials or transactions, and record only the task outcome
  and aggregate counts needed to diagnose it.
- On a first-party and a third-party request, inspect the outgoing headers and
  confirm `Sec-GPC: 1` and `DNT: 1` are present regardless of the site's own
  Do Not Track or Global Privacy Control setting.
- On a content page, confirm `navigator.globalPrivacyControl` reads `true` in
  the page's own console, not just the extension's context.
- Confirm the signal headers are added even when a site is paused, and that a
  user Block or Allow override does not remove them.

## Known Limitations

- UI verification uses Vitest, WXT builds, `web-ext` validation, a
  Selenium-based real-Firefox harness (`npm run test:ui`), and manual
  checks. Selenium was chosen over Playwright for the browser harness
  because Playwright's Firefox support runs a patched build with limited
  WebExtension internals, whereas Selenium's `driver.installAddon()`
  sideloads the packaged extension into an unmodified Firefox — the same
  install path real users get, including `moz-extension://` and
  `browser.*` behavior.
- The UI harness resolves a Firefox binary from `FIREFOX_BINARY`, then a
  short list of per-OS default install paths, then falls back to `firefox`
  on `PATH`. It resolves geckodriver only from `GECKODRIVER_PATH` so a missing
  or unpinned driver cannot cause an implicit network download.
- The packaged catalog is intentionally conservative; broad mixed-use product
  domains remain out of its default block rules.
- Top-level navigations reset tab evidence and are not shown as request rows.
- Automatic EasyPrivacy `main_frame` enforcement is a separate future project.
- The GPC/DNT signal is sent on every request regardless of the browser's own
  Firefox setting; DNT in particular is widely ignored by sites and mainly kept
  for backward compatibility with older opt-out parsers. GPC carries legal weight
  in a growing set of US states; DNT does not.
