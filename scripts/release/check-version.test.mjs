import { describe, expect, it } from 'vitest';
import { checkVersion, checkCommittedVersion } from './check-version.mjs';

describe('release version input', () => {
  it.each(['0.1.1', '0.2.0', '1.0.0'])('accepts a later stable version: %s', (version) => {
    expect(() => checkVersion(version, '0.1.0')).not.toThrow();
  });
  it.each(['0.1.0', '0.0.9', 'v0.1.1', '01.2.3', '0.1.1-beta', '--help', '0.1.1\n', '$(echo bad)'])('rejects invalid or non-increasing input: %s', (version) => {
    expect(() => checkVersion(version, '0.1.0')).toThrow();
  });
});

describe('committed release version', () => {
  it('accepts the version already saved in the repository', () => {
    expect(() => checkCommittedVersion('0.1.1', '0.1.1')).not.toThrow();
  });
  it.each(['0.1.0', '0.1.2', 'v0.1.1', '0.1.1\n'])('rejects a mismatched version: %s', (version) => {
    expect(() => checkCommittedVersion(version, '0.1.1')).toThrow();
  });
});
