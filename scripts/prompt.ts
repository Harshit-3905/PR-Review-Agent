import { PRFile } from './github';

const MAX_PATCH_CHAR_LIMIT = 10000; // Limit per file patch
const MAX_TOTAL_CHAR_LIMIT = 80000; // Limit for the entire prompt content

/**
 * Compiles a list of changed PR files and patches into a structured review prompt.
 * Truncates individual patches and overall content to stay within context and rate limits.
 */
export function compilePrompt(files: PRFile[]): string {
  let prompt = 'Please review the following code changes from a pull request.\n\n';

  prompt += '### Changed Files:\n\n';

  let currentLength = prompt.length;

  for (const file of files) {
    if (!file.patch) {
      continue; // Skip files without patches (e.g. binary or very large files)
    }

    let patchContent = file.patch;
    let isTruncated = false;

    if (patchContent.length > MAX_PATCH_CHAR_LIMIT) {
      patchContent = patchContent.substring(0, MAX_PATCH_CHAR_LIMIT);
      isTruncated = true;
    }

    let filePromptSection = `File: ${file.filename}\n`;
    filePromptSection += '```diff\n';
    filePromptSection += patchContent;
    if (isTruncated) {
      filePromptSection += '\n... [Patch truncated for size] ...';
    }
    filePromptSection += '\n```\n\n';

    // Check if adding this file will exceed the total character limit
    if (currentLength + filePromptSection.length > MAX_TOTAL_CHAR_LIMIT) {
      prompt += `File: ${file.filename}\n[Skipped this and remaining file patches because prompt size limit of ${MAX_TOTAL_CHAR_LIMIT} characters was reached]\n\n`;
      break;
    }

    prompt += filePromptSection;
    currentLength += filePromptSection.length;
  }

  return prompt;
}
