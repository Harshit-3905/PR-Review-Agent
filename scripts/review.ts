import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment, addCommentReaction } from './github';
import { parseProviderConfig, createProvider } from './config';
import { compilePrompt } from './prompt';
import { ReviewService } from './review-service';

async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is missing.');

    core.info('Extracting PR context...');
    const { prNumber, owner, repo, commentBody, commentId } = getPRContext();

    const octokit = getOctokitClient(githubToken);

    const providerConfig = parseProviderConfig(commentBody);
    const model = providerConfig.model
      || (providerConfig.provider === 'openrouter' ? (process.env.OPENROUTER_MODEL || 'openrouter/free')
        : providerConfig.provider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o')
        : providerConfig.provider === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
        : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'));

    core.info(`Provider: ${providerConfig.provider}, Model: ${model}`);
    core.info(`PR #${prNumber} on ${owner}/${repo}`);

    const service = new ReviewService({
      addEyesReaction: async () => {
        if (commentId) {
          await addCommentReaction(octokit, owner, repo, commentId, 'eyes');
          core.info('Added 👀 reaction to trigger comment.');
        }
      },
      fetchPRFiles: () => fetchPRFiles(octokit, owner, repo, prNumber),
      postComment: (body) => createPRComment(octokit, owner, repo, prNumber, body),
      generateReview: (prompt) => createProvider(providerConfig).generateReview(prompt),
      compilePrompt,
      providerName: providerConfig.provider,
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
