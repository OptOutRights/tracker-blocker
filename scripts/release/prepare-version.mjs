import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkVersion } from './check-version.mjs';

export async function prepareVersion(root, version) {
  const packagePath = path.join(root, 'package.json');
  const lockPath = path.join(root, 'package-lock.json');
  const [packageText, lockText] = await Promise.all([
    readFile(packagePath, 'utf8'), readFile(lockPath, 'utf8'),
  ]);
  const pkg = JSON.parse(packageText);
  const lock = JSON.parse(lockText);
  checkVersion(version, pkg.version);
  assert.equal(lock.version, pkg.version, 'Lockfile version must match before preparing a release.');
  assert.equal(lock.packages?.['']?.version, pkg.version, 'Lockfile root version must match before preparing a release.');
  pkg.version = version;
  lock.version = version;
  lock.packages[''].version = version;
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  try {
    await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  } catch (error) {
    await writeFile(packagePath, packageText);
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 3, 'Usage: npm run release:prepare -- VERSION');
  await prepareVersion(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), process.argv[2]);
  console.log(`Prepared version ${process.argv[2]}. Commit and review both package files before release.`);
}
