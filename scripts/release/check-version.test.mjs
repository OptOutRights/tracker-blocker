import { describe, expect, it } from 'vitest';
import { checkVersion } from './check-version.mjs';

describe('release version input', () => {
  it.each(['0.1.1', '0.2.0', '1.0.0'])('accepts a later stable version: %s', (version) => {
    expect(() => checkVersion(version, '0.1.0')).not.toThrow();
  });
  it.each(['0.1.0', '0.0.9', 'v0.1.1', '01.2.3', '0.1.1-beta', '--help', '0.1.1\n', '$(echo bad)'])('rejects invalid or non-increasing input: %s', (version) => {
    expect(() => checkVersion(version, '0.1.0')).toThrow();
  });
});
