# Firefox release automation

Local validation on October 24, 2026: clean installation with npm 11.9.0
passed after repairing optional-dependency lockfile entries; 229 tests,
TypeScript, Firefox build, and EasyPrivacy byte-identical verification passed.
Workflow YAML and actionlint 1.7.12 checks passed. Generated JSON files now
explicitly retain LF endings on Windows. The ARM64 Docker job and AMO submission have not been
executed locally; no Docker executable is installed in this environment.
GitHub Actions execution and secret-name/listing confirmation remain required
before calling the workflow release-ready.

The Firefox release workflow validates pull requests that change the release
tooling. Manual dispatch builds a selected stable version; publication defaults
to off. The version is bumped and committed only inside the runner checkout,
so the reproducibility evidence records a clean release commit. It does not
push that commit, create a tag, or change main's package version. Retain the
source archive and evidence as the record of exactly what was submitted.

## Before enabling publication

Merge PR #13, rebase this release branch onto main, and review/merge the
workflow. Confirm the intended version with Mustafa (the earlier request was
0.1.1). Confirm the existing AMO listing uses trackerblocker@optoutrights.org
and that the API account can update it. Initial AMO listings may require
additional listing metadata; this workflow targets updates to an existing
listing.

Create the GitHub environment `firefox-release`. Configure its reviewers and
main-branch deployment restriction as desired. Confirm that the existing
Mozilla secrets are named `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`, or change the
two workflow references to match their actual names. Secret values are never
needed locally or in chat. The workflow does not create an approval rule for
the environment itself.

## Dry run and submission

Run Firefox release from Actions with version 0.1.1 and publish unchecked.
Inspect the unit/type/filter checks, extension validation, and uploaded
firefox-release-evidence artifact. The container builds the extension and
source archives, rebuilds from the source archive, and compares all extension
files byte-for-byte using the existing reviewer environment contract.

After a successful dry run and maintainer authorization, dispatch from main
with the agreed version and publish checked. Submission downloads that run's
verified archives and uploads the matching source to AMO. It does not rebuild
the extension in the credentials-bearing job. AMO review/publication may be
asynchronous: workflow success means submitted, not necessarily publicly live.
Check the AMO developer dashboard before retrying an ambiguous submission;
do not blindly submit the same version twice.

The workflow does not yet automate GitHub tags/releases or persist version
bumps upstream. Each new dispatch must select a version newer than the last
AMO submission as well as package.json. Browser integration and manual
representative-site checks remain release checks in docs/qa.md; they are not
claimed to run in this workflow. Selenium-in-CI remains deferred.
