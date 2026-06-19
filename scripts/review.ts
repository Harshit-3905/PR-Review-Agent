import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment, addCommentReaction } from './github';
import { parseProviderConfig } from './config';
import { compilePrompt } from './prompt';
import { ReviewService } from './review-service';
import { AIProvider, type ProviderType } from './ai-provider';

function getModel(provider: ProviderType, override?: string): string {
  if (override) return override;
  const envMap: Record<ProviderType, string> = {
    openrouter: process.env.OPENROUTER_MODEL || 'openrouter/free',
    openai: process.env.OPENAI_MODEL || 'gpt-4o',
    gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  };
  return envMap[provider];
}

function getApiKey(provider: ProviderType): string {
  const envMap: Record<ProviderType, string | undefined> = {
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };
  return envMap[provider] || '';
}

async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is missing.');

    core.info('Extracting PR context...');
    const { prNumber, owner, repo, commentBody, commentId } = getPRContext();

    const octokit = getOctokitClient(githubToken);

    const config = parseProviderConfig(commentBody);
    const model = getModel(config.provider, config.model);
    const apiKey = getApiKey(config.provider);

    core.info(`Provider: ${config.provider}, Model: ${model}`);
    core.info(`PR #${prNumber} on ${owner}/${repo}`);

    const aiProvider = new AIProvider({ provider: config.provider, apiKey, model });

    const service = new ReviewService({
      addEyesReaction: async () => {
        if (commentId) {
          await addCommentReaction(octokit, owner, repo, commentId, 'eyes');
          core.info('Added 👀 reaction to trigger comment.');
        }
      },
      fetchPRFiles: () => fetchPRFiles(octokit, owner, repo, prNumber),
      postComment: (body) => createPRComment(octokit, owner, repo, prNumber, body),
      generateReview: (prompt) => aiProvider.generateReview(prompt),
      compilePrompt,
      providerName: config.provider,
      model,
    });

    const result = await service.run();
    core.info(`Files changed: ${result.filesChanged}`);
    core.info(`Prompt size: ${result.promptSize} characters`);
    core.info('AI review completed successfully!');
  } catch (error: any) {
    core.setFailed(`AI PR Review Agent failed: ${error.message || error}`);
  }
}

run();
