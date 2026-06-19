import * as core from '@actions/core';
import { getOctokitClient, getPRContext, fetchPRFiles, createPRComment } from './github';
import { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { compilePrompt } from './prompt';

interface ProviderConfig {
  provider: 'openai' | 'gemini';
  model?: string;
}

function parseProviderConfig(commentBody: string): ProviderConfig {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  const providerMatch = commentBody.match(/--provider\s+(\S+)/i);
  const modelMatch = commentBody.match(/--model\s+(\S+)/i);

  const requestedProvider = providerMatch?.[1]?.toLowerCase();
  const requestedModel = modelMatch?.[1];

  if (requestedProvider === 'gemini') {
    if (!hasGemini) throw new Error('Gemini provider requested but GEMINI_API_KEY is not set.');
    return { provider: 'gemini', model: requestedModel };
  }
  if (requestedProvider === 'openai') {
    if (!hasOpenAI) throw new Error('OpenAI provider requested but OPENAI_API_KEY is not set.');
    return { provider: 'openai', model: requestedModel };
  }

  if (requestedModel) {
    if (requestedModel.startsWith('gemini')) {
      if (!hasGemini) throw new Error('Model appears to be a Gemini model but GEMINI_API_KEY is not set.');
      return { provider: 'gemini', model: requestedModel };
    }
    if (hasOpenAI) {
      return { provider: 'openai', model: requestedModel };
    }
  }

  if (hasOpenAI && !hasGemini) return { provider: 'openai' };
  if (hasGemini && !hasOpenAI) return { provider: 'gemini' };
  if (hasOpenAI && hasGemini) return { provider: 'openai' };

  throw new Error('No AI provider configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY.');
}

function createProvider(config: ProviderConfig): AIProvider {
  if (config.provider === 'openai') {
    const model = config.model || process.env.OPENAI_MODEL || 'gpt-4o';
    return new OpenAIProvider(process.env.OPENAI_API_KEY!, model);
  }
  const model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return new GeminiProvider(process.env.GEMINI_API_KEY!, model);
}

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
