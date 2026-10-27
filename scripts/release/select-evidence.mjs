import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkCommittedVersion } from './check-version.mjs';

export async function selectEvidence(root, version, revision) {
  checkCommittedVersion(version, version);
  assert.match(revision ?? '', /^[a-f0-9]{40}$/, 'Expected a full Git revision.');
  const reports = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), 'Release evidence must not contain symbolic links.');
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name === 'evidence.json') reports.push(file);
    }
  }
  await walk(path.resolve(root));
  assert.equal(reports.length, 1, 'Expected exactly one release evidence report.');
  const report = JSON.parse(await readFile(reports[0], 'utf8'));
  assert.equal(report.schemaVersion, 1, 'Unsupported release evidence schema.');
  assert.equal(report.releaseReady, true, 'Evidence must be final, not rehearsal.');
  assert.equal(report.mode, 'final', 'Evidence must be final, not rehearsal.');
  assert.equal(report.project?.name, 'trackerblocker', 'Unexpected release project.');
  assert.equal(report.project?.version, version, 'Evidence version does not match this release.');
  assert.equal(report.repository?.revision, revision, 'Evidence revision does not match this build.');
  assert.equal(report.repository?.status, '', 'Evidence must describe a clean revision.');
  assert.equal(report.comparison?.byteIdenticalContents, true, 'Source rebuild was not verified.');
  assert.deepEqual(report.comparison?.differences, [], 'Source rebuild contains differences.');
  const result = {};
  for (const [kind, suffix] of [['extension', 'firefox'], ['source', 'sources']]) {
    const archive = report.archives?.[kind];
    assert.equal(archive?.name, `trackerblocker-${version}-${suffix}.zip`, 'Unexpected archive name.');
    const file = path.join(path.dirname(reports[0]), archive.name);
    assert(!/[\r\n]/.test(file), 'Archive paths must not contain line breaks.');
    const bytes = await readFile(file);
    assert.equal(bytes.length, archive.size, `${kind} archive size mismatch.`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), archive.sha256,
      `${kind} archive checksum mismatch.`);
    result[kind] = file;
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 5, 'Usage: select-evidence.mjs DIRECTORY VERSION REVISION');
  const result = await selectEvidence(...process.argv.slice(2));
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `extension=${result.extension}\nsource=${result.source}\n`);
  }
  console.log('Release evidence, version, revision, and both archive checksums verified.');
}
