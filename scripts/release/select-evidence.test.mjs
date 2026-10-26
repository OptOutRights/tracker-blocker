import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { selectEvidence } from './select-evidence.mjs';

const roots = [];
const revision = 'a'.repeat(40);
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tracker-evidence-'));
  roots.push(root);
  const report = { schemaVersion: 1, releaseReady: true, mode: 'final',
    project: { name: 'trackerblocker', version: '0.1.1' },
    repository: { revision, status: '' },
    comparison: { byteIdenticalContents: true, differences: [] }, archives: {} };
  for (const [kind, suffix] of [['extension', 'firefox'], ['source', 'sources']]) {
    const bytes = Buffer.from(kind);
    const name = `trackerblocker-0.1.1-${suffix}.zip`;
    await writeFile(path.join(root, name), bytes);
    report.archives[kind] = { name, size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  await writeFile(path.join(root, 'evidence.json'), JSON.stringify(report));
  return { root, report };
}
describe('release package selection', () => {
  it('selects the matching verified pair', async () => {
    const { root } = await fixture();
    const selected = await selectEvidence(root, '0.1.1', revision);
    expect(await readFile(selected.extension, 'utf8')).toBe('extension');
    expect(await readFile(selected.source, 'utf8')).toBe('source');
  });
  it.each(['extension', 'source'])('rejects a changed %s archive', async kind => {
    const { root, report } = await fixture();
    await writeFile(path.join(root, report.archives[kind].name), 'x'.repeat(kind.length));
    await expect(selectEvidence(root, '0.1.1', revision)).rejects.toThrow('checksum mismatch');
  });
  it('rejects evidence for another version or revision', async () => {
    const { root } = await fixture();
    await expect(selectEvidence(root, '0.1.2', revision)).rejects.toThrow('version');
    await expect(selectEvidence(root, '0.1.1', 'b'.repeat(40))).rejects.toThrow('revision');
  });
  it('rejects multiple reports rather than guessing', async () => {
    const { root, report } = await fixture();
    await mkdir(path.join(root, 'other'));
    await writeFile(path.join(root, 'other/evidence.json'), JSON.stringify(report));
    await expect(selectEvidence(root, '0.1.1', revision)).rejects.toThrow('exactly one');
  });
  it('rejects missing archives', async () => {
    const { root, report } = await fixture();
    await rm(path.join(root, report.archives.source.name));
    await expect(selectEvidence(root, '0.1.1', revision)).rejects.toThrow();
  });
  it.each(['rehearsal', 'path', 'rebuild'])('rejects unsuitable evidence: %s', async failure => {
    const { root, report } = await fixture();
    if (failure === 'rehearsal') report.releaseReady = false;
    if (failure === 'path') report.archives.source.name = '../source.zip';
    if (failure === 'rebuild') report.comparison.differences = ['changed background.js'];
    await writeFile(path.join(root, 'evidence.json'), JSON.stringify(report));
    await expect(selectEvidence(root, '0.1.1', revision)).rejects.toThrow();
  });
});
