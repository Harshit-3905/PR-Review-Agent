import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment } from './github';
import { parseProviderConfig, createProvider } from './config';
import { compilePrompt } from './prompt';

async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is missing.');

    core.info('Extracting PR context...');
    const { prNumber, owner, repo, commentBody } = getPRContext();
    core.info(`Context parsed: PR #${prNumber} on ${owner}/${repo}`);

    if (!commentBody.includes('/review-ai')) {
      core.info('Comment does not contain "/review-ai". Skipping.');
      return;
    }

    core.info('Initializing GitHub client...');
    const octokit = getOctokitClient(githubToken);

    core.info('Fetching PR changed files...');
    const files = await fetchPRFiles(octokit, owner, repo, prNumber);
    core.info(`Found ${files.length} changed files.`);

    if (files.length === 0) {
      core.info('No changed files found.');
      await createPRComment(octokit, owner, repo, prNumber, '🤖 AI Review Agent: No code changes found to review.');
      return;
    }

    const providerConfig = parseProviderConfig(commentBody);
    core.info(`Using provider: ${providerConfig.provider}${providerConfig.model ? ` (model: ${providerConfig.model})` : ''}`);

    core.info('Compiling review prompt...');
    const prompt = compilePrompt(files);

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
