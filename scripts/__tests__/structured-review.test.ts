import { describe, it, expect } from 'vitest';
import { parseStructuredReview, formatStructuredReview } from '../structured-review';
import type { StructuredReview } from '../review-schema';

describe('parseStructuredReview', () => {
  it('parses a valid minimal JSON review', () => {
    const raw = JSON.stringify({
      summary: 'Looks good overall.',
      findings: [],
    });
    const result = parseStructuredReview(raw);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Looks good overall.');
    expect(result!.findings).toEqual([]);
  });

  it('parses a review with findings', () => {
    const raw = JSON.stringify({
      summary: 'Some issues found.',
      findings: [
        {
          severity: 'High',
          category: 'Bugs',
          message: 'Potential null reference',
          file: 'src/user.ts',
          line: 42,
          suggestion: 'Use optional chaining',
        },
      ],
    });
    const result = parseStructuredReview(raw);
    expect(result).not.toBeNull();
    expect(result!.findings).toHaveLength(1);
    expect(result!.findings[0].severity).toBe('High');
    expect(result!.findings[0].file).toBe('src/user.ts');
    expect(result!.findings[0].line).toBe(42);
  });

  it('returns null for plain text without JSON', () => {
    const result = parseStructuredReview('This is a great PR! No issues found.');
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON structure', () => {
    const raw = JSON.stringify({ foo: 'bar' });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });

  it('returns null for missing findings', () => {
    const raw = JSON.stringify({ summary: 'test' });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });

  it('returns null for non-array findings', () => {
    const raw = JSON.stringify({ summary: 'test', findings: 'not an array' });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });

  it('extracts JSON from markdown code fence', () => {
    const raw = 'Here is my review:\n\n```json\n{"summary": "Good PR", "findings": []}\n```\n\nEnd.';
    const result = parseStructuredReview(raw);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Good PR');
  });

  it('extracts JSON from code fence without language tag', () => {
    const raw = '```\n{"summary": "Clean", "findings": []}\n```';
    const result = parseStructuredReview(raw);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Clean');
  });

  it('finds JSON object buried in text', () => {
    const raw = 'Some text before {"summary": "Buried", "findings": []} and text after';
    const result = parseStructuredReview(raw);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Buried');
  });

  it('rejects findings with invalid severity', () => {
    const raw = JSON.stringify({
      summary: 'Bad severity',
      findings: [{ severity: 'Urgent', category: 'Bugs', message: 'test' }],
    });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });

  it('rejects findings with invalid category', () => {
    const raw = JSON.stringify({
      summary: 'Bad category',
      findings: [{ severity: 'Low', category: 'Docs', message: 'test' }],
    });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });

  it('rejects findings without message', () => {
    const raw = JSON.stringify({
      summary: 'No message',
      findings: [{ severity: 'Low', category: 'Bugs' }],
    });
    const result = parseStructuredReview(raw);
    expect(result).toBeNull();
  });
});

describe('formatStructuredReview', () => {
  const sampleReview: StructuredReview = {
    summary: 'This PR introduces a new authentication flow. The implementation is clean but has a few issues.',
    findings: [
      {
        severity: 'High',
        category: 'Security',
        message: 'API keys are hardcoded in the source file.',
        file: 'src/config.ts',
        line: 10,
        suggestion: 'Move secrets to environment variables.',
      },
      {
        severity: 'Low',
        category: 'Style',
        message: 'Long lines exceed 100 character limit.',
        file: 'src/auth.ts',
        suggestion: 'Break long lines for readability.',
      },
      {
        severity: 'Nit',
        category: 'Maintainability',
        message: 'Minor typo in variable name.',
      },
    ],
  };

  it('includes the summary heading', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('## Summary');
    expect(output).toContain(sampleReview.summary);
  });

  it('includes the findings heading', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('## Findings');
  });

  it('renders each finding with severity and category', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('[High] Security');
    expect(output).toContain('[Low] Style');
    expect(output).toContain('[Nit] Maintainability');
  });

  it('includes file and line references', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('src/config.ts:10');
    expect(output).toContain('src/auth.ts');
    expect(output).not.toContain('undefined');
  });

  it('includes suggestions', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('Move secrets to environment variables');
    expect(output).toContain('Break long lines for readability');
  });

  it('renders empty findings gracefully', () => {
    const empty: StructuredReview = { summary: 'All good.', findings: [] };
    const output = formatStructuredReview(empty);
    expect(output).toContain('No issues or notable patterns found');
    expect(output).not.toContain('undefined');
  });

  it('handles finding without file and suggestion', () => {
    const output = formatStructuredReview(sampleReview);
    expect(output).toContain('Minor typo in variable name');
  });
});
