import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function checkVersion(next, current) {
  const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  assert.match(next ?? '', pattern, 'Use a stable major.minor.patch version without a v prefix.');
  assert.equal(next, next.trim(), 'Release version must not contain surrounding whitespace.');
  assert.match(current, pattern, 'The current package version must be stable.');
  const a = next.split('.').map(BigInt);
  const b = current.split('.').map(BigInt);
  const difference = a.findIndex((part, index) => part !== b[index]);
  assert(difference >= 0 && a[difference] > b[difference], 'Release version must exceed package.json.');
}

export function checkCommittedVersion(requested, current) {
  assert.match(requested ?? '', /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    'Use a stable major.minor.patch version without a v prefix.');
  assert.equal(requested, current,
    'Requested release must match the committed package version. Prepare and merge the version change first.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  assert(process.argv.length === 3 || (process.argv.length === 4 && process.argv[3] === '--committed'),
    'Usage: check-version.mjs VERSION [--committed]');
  if (process.argv[3] === '--committed') {
    const lock = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url), 'utf8'));
    checkCommittedVersion(process.argv[2], pkg.version);
    assert.equal(lock.version, pkg.version, 'Lockfile version must match package.json.');
    assert.equal(lock.packages?.['']?.version, pkg.version, 'Lockfile root version must match package.json.');
  } else {
    checkVersion(process.argv[2], pkg.version);
  }
  console.log(`Release version accepted: ${process.argv[2]}`);
}
