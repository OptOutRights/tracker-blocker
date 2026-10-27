# Firefox release automation

Local validation: 246 tests, TypeScript, and actionlint passed. GitHub Actions
also verified the ARM64 build, byte-identical source rebuild, package version,
archive checksums, extension validation, and artifact upload against main.
Consult the current PR check for the result at its latest revision. Publication
was skipped in practice runs; actual AMO submission remains untested.

The Firefox release workflow validates pull requests that change relevant code
or release tooling. PRs temporarily bump the patch version to exercise the
versioned package path; this preview is not a release decision. Manual dispatch
builds the stable version already saved in the selected commit; publication
defaults to off. The requested version must match both package files. Only
PR previews bump the version in the runner checkout. Retain the source archive
and evidence as the record of exactly what was submitted.

## Before enabling publication

PR #13 is merged and this release branch includes it. Review and merge the
workflow. Confirm the intended version with Mustafa (the earlier request was
0.1.1). Confirm the existing AMO listing uses trackerblocker@optoutrights.org
and that the API account can update it. Initial AMO listings may require
additional listing metadata; this workflow targets updates to an existing
listing.

The workflow uses the existing repository secrets `AMO_JWT_ISSUER` and
`AMO_JWT_SECRET`; their names were verified without accessing values. It does
not require a separately configured GitHub environment or environment approval.
Publishing requires manual dispatch from main with publish explicitly checked,
and successful verification first. Anyone with permission to dispatch that
workflow from main can request publication. Maintainers should approve this
permission model as part of review. Secret values are not needed locally.

## Dry run and submission

First prepare the agreed version on a release-preparation branch:

```sh
npm run release:prepare -- 0.1.1
```

This changes package.json and both root version fields in package-lock.json
without changing dependencies. Review and commit those two files, then merge
the version change through the normal PR process. The example is not approval
to select 0.1.1. Real releases build a committed version rather than creating
an unpublished runner-only version commit.

Run Firefox release from Actions with version 0.1.1 and publish unchecked.
Inspect the unit/type/filter checks, extension validation, and uploaded
firefox-release-evidence artifact. The container builds the extension and
source archives, rebuilds from the source archive, and compares all extension
files byte-for-byte using the existing reviewer environment contract.

After a successful dry run and maintainer authorization, dispatch from main
with the agreed version and publish checked. Submission downloads that run's
verified archives and uploads the matching source to AMO. It does not rebuild
the extension in the credentials-bearing job. Before extraction, both ZIPs
are selected from exactly one final evidence report. The project, version,
clean Git revision, source-rebuild result, file sizes, and SHA-256 checksums
must match. These checks also run before artifact upload in the verification
job. Missing, changed, mismatched, or ambiguous packages stop the workflow.
The web-ext signing command repackages the extracted verified files for upload;
it does not compile the source again. AMO review/publication may be
asynchronous: workflow success means submitted, not necessarily publicly live.
Check the AMO developer dashboard before retrying an ambiguous submission;
do not blindly submit the same version twice.

The workflow does not create GitHub tags or GitHub releases. Version changes
are saved through the preparation command and normal code review. Each real
dispatch must match the committed version and use a version not previously
submitted to AMO. Browser integration and manual
representative-site checks remain release checks in docs/qa.md; they are not
claimed to run in this workflow. Selenium-in-CI remains deferred.
