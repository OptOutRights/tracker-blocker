# Next Firefox update: preparation checklist

Status on October 24, 2026: local preparation only. No new branch was pushed,
no release PR was opened, and no extension was submitted to AMO.

## Already verified

- [x] PR #13 local HEAD matches the pushed GPC branch (8b01e77).
- [x] PR #13 includes main's merged PR #14 commit (2d5cf9c).
- [x] PR #13 targeted Firefox GPC and popup/options checks passed.
- [x] Release checkout clean installation passed with npm 11.9.0 after
  repairing optional-dependency lockfile entries.
- [x] Release checkout: 229 unit tests, TypeScript, Firefox build,
  EasyPrivacy verification, and extension/source packaging passed.
- [x] Workflow passed actionlint 1.7.12.
- [x] Local package inspection: correct extension ID, version agreement,
  document-start GPC content script in all frames, required filter data and
  license files, no custom update URL, and required reviewer source files.
- [x] Archive inspection found no duplicate/traversal paths or the checked
  private key, environment, dependency, and Git directories in the source ZIP.
- [x] GitHub secret names match AMO_JWT_ISSUER and AMO_JWT_SECRET.
  Secret values were not accessed.

These results have different scopes: the existing Firefox tests establish
GPC behavior; they do not prove the new GitHub workflow or AMO upload works.
Archive checks do not replace a complete manual secret/content review.

## Before submitting an update

- [ ] Mustafa reviews and merges #13; address any feedback first.
- [ ] Confirm the version for the update. Earlier request: 0.1.1;
  latest wording: "new v1". Current local archives are still version 0.1.0
  and are verification outputs, not the next release.
- [ ] Confirm the existing AMO listing ID and account access, and inspect
  the currently published version to avoid reusing a version number.
- [ ] Decide whether to complete automation for this update or release
  manually. Automation is not a technical prerequisite for updating AMO.
- [ ] Rebase the release work onto merged main and review the final diff.
- [ ] Before using automation, open its separate PR when ready and run the
  ARM64 Docker/source-rebuild job on GitHub. It has not run locally because
  Docker is unavailable. Do not describe the workflow as release-ready yet.
- [ ] Confirm the firefox-release environment settings. The YAML names the
  environment but does not itself create required reviewers or protections.
- [ ] Re-run release checks against the agreed final version and commit,
  including applicable Firefox minimum-version/integration checks and manual
  representative-site checks in docs/qa.md.
- [ ] Review the final source archive and retain byte-identical rebuild
  evidence for the actual release artifacts.
- [ ] Submit only after maintainer authorization, then check AMO status.
  A successful API submission does not mean Mozilla has published it.

## Workflow limitations to keep visible in review

- The version bump currently exists only in the runner checkout. It does not
  update main, create a version tag, or create a GitHub release. The source
  archive and evidence preserve that runner commit; an upstream version/tag
  policy still needs choosing before this becomes the normal release process.
- It checks the requested version against package.json, not AMO's last
  submitted version. The operator must check AMO before running it.
- Selenium-in-CI remains deferred, consistent with Mustafa's message.
- Public AMO listing updates are supported; initial listing metadata is not
  prepared by this workflow.
- Publication defaults to off and only runs on an explicit main-branch
  dispatch with publication selected. No automatic release is triggered by
  merging #13 or by opening a PR.
