# AI PR Review Agent

An automated, serverless Pull Request Review Agent built with TypeScript, GitHub Actions, and support for **OpenRouter** (default), **OpenAI**, **Google Gemini**, and **Anthropic Claude**.

## Features

- **Trigger on Command**: Automatically reviews pull requests only when a comment contains the `/review-ai` trigger.
- **Multi-Provider**: Supports OpenRouter, OpenAI, Gemini, and Anthropic. Use any combination; switch via comment flags.
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
          openrouter-api-key: ${{ secrets.OPENROUTER_API_KEY }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          openrouter-model: "openrouter/free"
          openai-model: "gpt-4o"
          gemini-model: "gemini-2.0-flash"
          anthropic-model: "claude-sonnet-4-20250514"
```

All API keys are optional. If only one is set, that provider is used. If multiple are set, **OpenRouter is the default** (it offers free models). Use `--provider` to override.

### Step 2: Set Up Secrets

1. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add one or more secrets:
   - `OPENROUTER_API_KEY` — Your OpenRouter API key (default provider, supports free models)
   - `OPENAI_API_KEY` — Your OpenAI API key
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - `ANTHROPIC_API_KEY` — Your Anthropic API key

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

When multiple providers are configured, you can choose which to use:

| Command                                                                          | Behavior                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/review-ai`                                                                     | Uses default provider (OpenRouter if configured, then OpenAI) |
| `/review-ai --provider openrouter`                                               | Uses OpenRouter with its default model                        |
| `/review-ai --provider anthropic`                                                | Uses Anthropic with its default model                         |
| `/review-ai --provider gemini`                                                   | Uses Gemini with its default model                            |
| `/review-ai --provider openai`                                                   | Uses OpenAI with its default model                            |
| `/review-ai --model gpt-4o`                                                      | Routes to OpenRouter (or OpenAI if no OpenRouter key)         |
| `/review-ai --model gemini-2.0-flash`                                            | Uses Gemini with the specified model                          |
| `/review-ai --model claude-sonnet-4-20250514`                                    | Uses Anthropic with the specified model                       |
| `/review-ai --provider openrouter --model meta-llama/llama-3.2-3b-instruct:free` | Explicit provider + model                                     |

---

## Configuration

| Input                  | Default                                 | Description                                                        |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `openrouter-api-key`   | —                                       | OpenRouter API key (default provider, free models available)       |
| `openrouter-model`     | `openrouter/free`                       | OpenRouter model name                                              |
| `openai-api-key`       | —                                       | OpenAI API key                                                     |
| `openai-model`         | `gpt-4o`                                | OpenAI model name                                                  |
| `gemini-api-key`       | —                                       | Gemini API key                                                     |
| `gemini-model`         | `gemini-2.0-flash`                      | Gemini model name                                                  |
| `anthropic-api-key`    | —                                       | Anthropic API key                                                  |
| `anthropic-model`      | `claude-sonnet-4-20250514`              | Anthropic model name                                               |
| `github-token`         | `${{ github.token }}`                   | GitHub token for API access                                        |
| `review-allowed-roles` | `admin,write,owner,member,collaborator` | Comma-separated list of GitHub roles that can trigger `/review-ai` |

## Permission Control

By default, any user with **admin** or **write** access to the repository (including organization owners, members, and outside collaborators with those permissions) can trigger a review by commenting `/review-ai`. The PR author is **not** automatically exempt — they must also have one of the allowed roles.

Restrict access by setting the `review-allowed-roles` input:

| Example                       | Effect                                         |
| ----------------------------- | ---------------------------------------------- |
| `'owner'`                     | Only the repository owner                      |
| `'owner,member'`              | Organization owner + members                   |
| `'admin,write'`               | Users with admin or write permission level     |
| `'owner,member,collaborator'` | Org owners, members, and outside collaborators |

If a user without the required role posts `/review-ai`, the agent posts a comment explaining the restriction and exits without fetching diffs or consuming API tokens.

### Workflow Example

```yaml
- name: Run AI Review Action
  uses: Harshit-3905/PR-Review-Agent@main
  with:
    review-allowed-roles: "owner,member"
    # ... other inputs
```
