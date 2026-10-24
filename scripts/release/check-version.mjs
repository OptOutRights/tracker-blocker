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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  checkVersion(process.argv[2], pkg.version);
  console.log(`Release version accepted: ${process.argv[2]}`);
}
