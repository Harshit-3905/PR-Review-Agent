import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment, addCommentReaction } from './github';
import { parseProviderConfig, createProvider } from './config';
import { compilePrompt } from './prompt';

async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is missing.');

    core.info('Extracting PR context...');
    const { prNumber, owner, repo, commentBody, commentId } = getPRContext();
    core.info(`PR #${prNumber} on ${owner}/${repo}`);

    const octokit = getOctokitClient(githubToken);

    if (commentId) {
      await addCommentReaction(octokit, owner, repo, commentId, 'eyes');
      core.info('Added 👀 reaction to trigger comment.');
    }

    const providerConfig = parseProviderConfig(commentBody);
    const model = providerConfig.model
      || (providerConfig.provider === 'openrouter' ? (process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free')
        : providerConfig.provider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o')
        : providerConfig.provider === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
        : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'));

    core.info(`Provider: ${providerConfig.provider}`);
    core.info(`Model: ${model}`);

    core.info('Fetching PR changed files...');
    const files = await fetchPRFiles(octokit, owner, repo, prNumber);
    core.info(`Files changed: ${files.length}`);

    if (files.length === 0) {
      core.info('No changed files found.');
      await createPRComment(octokit, owner, repo, prNumber, '🤖 AI Review Agent: No code changes found to review.');
      return;
    }

    core.info('Compiling review prompt...');
    const prompt = compilePrompt(files);
    core.info(`Prompt size: ${prompt.length} characters`);

    core.info('Creating AI provider...');
    const aiProvider = createProvider(providerConfig);

    core.info('Generating AI code review...');
    const reviewResult = await aiProvider.generateReview(prompt);

    core.info('Posting review comment...');
    await createPRComment(octokit, owner, repo, prNumber, reviewResult);

    core.info('AI review completed successfully!');
  } catch (error: any) {
    core.setFailed(`AI PR Review Agent failed: ${error.message || error}`);
  }
}

run();
