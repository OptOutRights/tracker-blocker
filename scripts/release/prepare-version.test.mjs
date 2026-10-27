import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prepareVersion } from './prepare-version.mjs';

const directories = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(root => rm(root, { recursive: true, force: true })));
});
async function fixture(lockVersion = '0.1.0') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tracker-release-version-'));
  directories.push(root);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ version: '0.1.0', dependencies: { example: '1.0.0' } }));
  await writeFile(path.join(root, 'package-lock.json'), JSON.stringify({ version: lockVersion, packages: { '': { version: '0.1.0' }, 'node_modules/example': { version: '1.0.0' } } }));
  return root;
}
async function contents(root) {
  return Promise.all(['package.json', 'package-lock.json'].map(file => readFile(path.join(root, file), 'utf8')));
}
describe('prepare a reviewable release version', () => {
  it('updates all three version fields while retaining dependencies', async () => {
    const root = await fixture();
    await prepareVersion(root, '0.1.1');
    const [pkg, lock] = (await contents(root)).map(JSON.parse);
    expect([pkg.version, lock.version, lock.packages[''].version]).toEqual(['0.1.1', '0.1.1', '0.1.1']);
    expect(pkg.dependencies).toEqual({ example: '1.0.0' });
    expect(lock.packages['node_modules/example'].version).toBe('1.0.0');
  });
  it('leaves both files unchanged if the input is invalid', async () => {
    const root = await fixture();
    const before = await contents(root);
    await expect(prepareVersion(root, '0.1.0')).rejects.toThrow();
    expect(await contents(root)).toEqual(before);
  });
  it('leaves both files unchanged if the lockfile is inconsistent', async () => {
    const root = await fixture('0.0.9');
    const before = await contents(root);
    await expect(prepareVersion(root, '0.1.1')).rejects.toThrow();
    expect(await contents(root)).toEqual(before);
  });
});
