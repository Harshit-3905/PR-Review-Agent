# AI PR Review Agent

An automated, serverless Pull Request Review Agent built with TypeScript, GitHub Actions, and support for **OpenAI** and **Google Gemini**.

## Features

- **Trigger on Command**: Automatically reviews pull requests only when a comment contains the `/review-ai` trigger.
- **Multi-Provider**: Supports OpenAI and Gemini. Use one or both; switch via comment flags.
- **Deep Code Analysis**: Focuses on logic bugs, security vulnerabilities, performance issues, and missing tests.
- **Diff Size Management**: Intelligent patch truncation and total prompt size limits to stay within context windows and minimize API costs.
- **No File Copying Needed**: Integrate as a reusable composite action.

---

## Integration Guide

### Step 1: Create a Workflow File

```yaml
name: AI PR Review

on:
  issue_comment:
    types: [created]

jobs:
  review:
    name: Run AI PR Review
    runs-on: ubuntu-latest

    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/review-ai')

    steps:
      - name: Run AI Review Action
        uses: Harshit-3905/PR-Review-Agent@main
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          openai-model: 'gpt-4o'
          gemini-model: 'gemini-2.0-flash'
```

Both API keys are optional. If only one is set, that provider is used by default. If both are set, it defaults to OpenAI unless the comment specifies otherwise.

### Step 2: Set Up Secrets

1. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add one or both secrets:
   - `OPENAI_API_KEY` — Your OpenAI API key
   - `GEMINI_API_KEY` — Your Google Gemini API key

### Step 3: Enable Action Permissions

Since the workflow needs to comment on the PR, ensure GitHub Actions has **write** permission:

1. Navigate to **Settings** -> **Actions** -> **General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Click **Save**.

> If you see `Resource not accessible by integration`, this is the fix.

---

## Usage

Post a comment on your PR with the trigger command:

```
/review-ai
```

### Provider & Model Selection

When both OpenAI and Gemini are configured, you can choose which provider to use:

| Command | Behavior |
|---------|----------|
| `/review-ai` | Uses default provider (OpenAI if both are configured) |
| `/review-ai --provider gemini` | Uses Gemini with its default model |
| `/review-ai --provider openai` | Uses OpenAI with its default model |
| `/review-ai --model gpt-4o` | Uses OpenAI with the specified model |
| `/review-ai --model gemini-2.0-flash` | Uses Gemini with the specified model |
| `/review-ai --provider gemini --model gemini-2.5-pro` | Explicit provider + model |

---

## Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Type-check
npm run lint
```

### Project Structure

```
scripts/
├── config.ts          # Provider selection logic
├── gemini.ts          # Gemini AI provider
├── github.ts          # GitHub API client utilities
├── openai.ts          # OpenAI provider
├── prompt.ts          # Review prompt compiler
├── provider.ts        # AIProvider interface
├── review.ts          # Main orchestrator
└── __tests__/         # Vitest tests
```

### Adding a New Provider

1. Create `scripts/<name>.ts` implementing `AIProvider` from `provider.ts`.
2. Add a `case` in `createProvider()` in `config.ts`.
3. Add the API key check in `parseProviderConfig()`.
4. Add the input in `action.yml`.

---

## Configuration

| Input | Default | Description |
|-------|---------|-------------|
| `openai-api-key` | — | OpenAI API key (optional if using Gemini) |
| `openai-model` | `gpt-4o` | OpenAI model name |
| `gemini-api-key` | — | Gemini API key (optional if using OpenAI) |
| `gemini-model` | `gemini-2.0-flash` | Gemini model name |
| `github-token` | `${{ github.token }}` | GitHub token for API access |
