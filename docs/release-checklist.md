# Next Firefox update: preparation checklist

Status on October 27, 2026: PR #13 is merged and PR #15 targets main.
GitHub packaging, source rebuild, saved-version checks, and package-evidence
verification passed at commit 1c13c93. The optional environment dependency was
removed afterward; check the latest PR run before requesting review.
No extension was submitted to AMO.

## Already verified

- [x] PR #13 local HEAD matches the pushed GPC branch (8b01e77).
- [x] PR #13 includes main's merged PR #14 commit (2d5cf9c).
- [x] PR #13 targeted Firefox GPC and popup/options checks passed.
- [x] Release checkout clean installation passed with npm 11.9.0 after
  repairing optional-dependency lockfile entries.
- [x] Release checkout: 246 unit tests, TypeScript, Firefox build,
  EasyPrivacy verification, and extension/source packaging passed.
- [x] Workflow passed actionlint 1.7.12.
- [x] Local package inspection: correct extension ID, version agreement,
  document-start GPC content script in all frames, required filter data and
  license files, no custom update URL, and required reviewer source files.
- [x] Archive inspection found no duplicate/traversal paths or the checked
  private key, environment, dependency, and Git directories in the source ZIP.
- [x] GitHub secret names match AMO_JWT_ISSUER and AMO_JWT_SECRET.
  Secret values were not accessed.
- [x] GitHub ARM64 container rebuild, packaging, validation and artifact upload
  passed at commit 4e43e10. Publication was skipped.
- [x] Public AMO listing reports version 0.1.0 and the expected extension ID.

These results have different scopes: the existing Firefox tests establish
GPC behavior; they do not prove the new GitHub workflow or AMO upload works.
Archive checks do not replace a complete manual secret/content review.

## Before submitting an update

- [x] Mustafa reviewed and merged #13.
- [ ] Confirm the version for the update. Earlier request: 0.1.1;
  latest wording: "new v1". Current local archives are still version 0.1.0
  and are verification outputs, not the next release.
- [ ] Prepare the agreed version using npm run release:prepare -- VERSION;
  review and merge both package files before a real release dispatch.
- [ ] Confirm the existing AMO listing ID and account access, and inspect
  the currently published version to avoid reusing a version number.
- [x] Integrate merged main into the release branch and retarget PR #15.
- [x] Confirm the PR-preview run passes the version bump and checks
  that the packaged manifest contains the preview version.
- [ ] Review the publishing permission model: existing repository secrets,
  successful verification, and manual dispatch from main with publish checked.
  No separate GitHub environment or environment approval is required.
- [ ] Re-run release checks against the agreed final version and commit,
  including applicable Firefox minimum-version/integration checks and manual
  representative-site checks in docs/qa.md.
- [ ] Review the final source archive and retain byte-identical rebuild
  evidence for the actual release artifacts.
- [ ] Submit only after maintainer authorization, then check AMO status.
  A successful API submission does not mean Mozilla has published it.

## Errors already fixed

- Clean npm ci rejected incomplete optional-dependency lock entries: repaired
  the lockfile, then confirmed clean installs locally and on GitHub.
- Windows checked out generated JSON with CRLF, breaking exact-byte checks:
  added LF attributes for those reports.
- First GitHub run: Docker rejected a six-CPU limit on its four-CPU host:
  container limit now uses the smaller of six and Docker's CPU count.
- Next run: Git rejected the runner-owned mounted input repository:
  trust only its two exact paths inside the temporary container.

## Remaining workflow limitations

- Package selection now verifies the evidence and both ZIP checksums in
  verification and submission jobs. Unit tests cover changed/missing files,
  wrong version/revision, duplicate reports, and rehearsal/invalid evidence.
  This validates local selection behavior, not Mozilla API acceptance.

- Real release versions must be saved in the repository through the
  preparation command and code review. Only practice builds use a temporary
  version. Creating version tags or GitHub releases is not automated.
- It checks the requested version against package.json, not AMO's last
  submitted version. The operator must check AMO before running it.
- Selenium-in-CI remains deferred, consistent with Mustafa's message.
- Public AMO listing updates are supported; initial listing metadata is not
  prepared by this workflow.
- Publication defaults to off and only runs on an explicit main-branch
  dispatch with publication selected. No automatic release is triggered by
  merging #13 or by opening a PR.
