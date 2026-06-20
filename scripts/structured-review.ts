import type { StructuredReview, ReviewFinding } from './types/review';

const VALID_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Nit'] as const;
const VALID_CATEGORIES = ['Bugs', 'Security', 'Performance', 'Testing', 'Style', 'Maintainability'] as const;

function isValidReviewFinding(data: unknown): data is ReviewFinding {
  if (!data || typeof data !== 'object') return false;
  const f = data as Record<string, unknown>;
  if (typeof f.message !== 'string') return false;
  if (!VALID_SEVERITIES.includes(f.severity as any)) return false;
  if (!VALID_CATEGORIES.includes(f.category as any)) return false;
  if (f.file !== undefined && typeof f.file !== 'string') return false;
  if (f.line !== undefined && typeof f.line !== 'number') return false;
  if (f.suggestion !== undefined && typeof f.suggestion !== 'string') return false;
  return true;
}

function isValidStructuredReview(data: unknown): data is StructuredReview {
  if (!data || typeof data !== 'object') return false;
  const r = data as Record<string, unknown>;
  if (typeof r.summary !== 'string') return false;
  if (!Array.isArray(r.findings)) return false;
  return r.findings.every(f => isValidReviewFinding(f));
}

export function parseStructuredReview(raw: string): StructuredReview | null {
  const candidates: string[] = [];

  // 1. Try direct parse of the raw response
  candidates.push(raw.trim());

  // 2. Try extracting from markdown code fence (```json ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) candidates.push(fenceMatch[1].trim());

  // 3. Try finding the outermost JSON object in the text
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  for (const candidate of [...new Set(candidates)]) {
    try {
      const parsed = JSON.parse(candidate);
      if (isValidStructuredReview(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

export function formatStructuredReview(review: StructuredReview): string {
  let output = `## Summary\n\n${review.summary}\n\n`;

  if (review.findings.length === 0) {
    output += 'No issues or notable patterns found in this change set.';
    return output;
  }

  output += '## Findings\n\n';

  for (const finding of review.findings) {
    const location = finding.file
      ? ` \u2014 \`${finding.file}${finding.line !== undefined ? `:${finding.line}` : ''}\``
      : '';

    output += `**[${finding.severity}] ${finding.category}**${location}\n\n`;
    output += `${finding.message}\n\n`;

    if (finding.suggestion) {
      output += `> **Suggestion:** ${finding.suggestion}\n\n`;
    }
  }

  return output.trim();
}
