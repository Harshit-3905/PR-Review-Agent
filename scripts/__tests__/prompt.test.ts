import { describe, it, expect } from 'vitest';
import { compilePrompt } from '../prompt';
import type { PRFile } from '../types/github';

function makeFile(filename: string, patch?: string): PRFile {
  return { filename, patch };
}

describe('compilePrompt', () => {
  it('returns a prompt with header when there are no files', () => {
    const result = compilePrompt([]);
    expect(result).toContain('Please review the following code changes');
    expect(result).toContain('### Changed Files:');
  });

  it('includes file diffs in the prompt', () => {
    const files = [makeFile('src/index.ts', '+console.log("hello")')];
    const result = compilePrompt(files);
    expect(result).toContain('File: src/index.ts');
    expect(result).toContain('```diff');
    expect(result).toContain('+console.log("hello")');
    expect(result).toContain('```');
  });

  it('includes multiple files', () => {
    const files = [
      makeFile('src/a.ts', '+file a'),
      makeFile('src/b.ts', '+file b'),
    ];
    const result = compilePrompt(files);
    expect(result).toContain('File: src/a.ts');
    expect(result).toContain('File: src/b.ts');
  });

  it('skips files without patches', () => {
    const files = [
      makeFile('src/a.ts', '+change'),
      makeFile('binary.bin', undefined),
    ];
    const result = compilePrompt(files);
    expect(result).toContain('File: src/a.ts');
    expect(result).not.toContain('binary.bin');
  });

  it('truncates patches exceeding MAX_PATCH_CHAR_LIMIT', () => {
    const largePatch = 'a'.repeat(10001);
    const files = [makeFile('large.ts', largePatch)];
    const result = compilePrompt(files);
    expect(result).toContain('[Patch truncated for size]');
    expect(result.length).toBeLessThan('a'.repeat(10001).length + 500);
  });

  it('stops adding files when total character limit is reached', () => {
    // Each patch is ~2000 chars so ~40 files will exceed the 80k limit
    const largePatch = '+'.repeat(2000);
    const files = Array.from({ length: 100 }, (_, i) =>
      makeFile(`src/file${i}.ts`, largePatch)
    );
    const result = compilePrompt(files);
    expect(result).toContain('[Skipped this and remaining file patches');
  });

  it('does not truncate small patches', () => {
    const patch = '+console.log("small")';
    const files = [makeFile('small.ts', patch)];
    const result = compilePrompt(files);
    expect(result).not.toContain('[Patch truncated for size]');
    expect(result).toContain(patch);
  });
});
