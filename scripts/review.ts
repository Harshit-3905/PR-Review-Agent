import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment } from './github';
import { OpenAIProvider } from './openai';
import { compilePrompt } from './prompt';

/**
 * Main orchestrator function for the AI PR Review Agent.
 */
async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is missing.');
    }
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is missing.');
    }

    core.info('Extracting PR context...');
    const { prNumber, owner, repo, commentBody } = getPRContext();
    core.info(`Context parsed successfully: PR #${prNumber} on ${owner}/${repo}`);

    // Double check trigger word (workflow filter should already ensure this, but good practice)
    if (!commentBody.includes('/review-ai')) {
      core.info('Comment does not contain trigger command "/review-ai". Skipping review.');
      return;
    }

    core.info('Initializing GitHub client...');
    const octokit = getOctokitClient(githubToken);

    core.info('Fetching PR changed files...');
    const files = await fetchPRFiles(octokit, owner, repo, prNumber);
    core.info(`Found ${files.length} changed files.`);

    if (files.length === 0) {
      core.info('No changed files found in the PR. Skipping review.');
      await createPRComment(
        octokit,
        owner,
        repo,
        prNumber,
        '🤖 AI Review Agent: No code changes found to review.'
      );
      return;
    }

    core.info('Compiling review prompt...');
    const prompt = compilePrompt(files);

    core.info('Initializing AI provider...');
    const aiProvider = new OpenAIProvider(openaiApiKey, openaiModel);

    core.info('Generating AI code review...');
    const reviewResult = await aiProvider.generateReview(prompt);

    core.info('Posting review comment back to PR...');
    await createPRComment(octokit, owner, repo, prNumber, reviewResult);

    core.info('AI review completed and posted successfully!');
  } catch (error: any) {
    core.setFailed(`AI PR Review Agent failed: ${error.message || error}`);
  }
}

run();
