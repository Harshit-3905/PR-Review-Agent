# AI PR Review Agent

An automated, serverless Pull Request Review Agent built with TypeScript, GitHub Actions, and the OpenAI API.

## Features

- **Trigger on Command**: Automatically reviews pull requests only when a comment contains the `/review-ai` trigger.
- **Deep Code Analysis**: Focuses on critical aspects like logic bugs, security vulnerabilities, performance issues, and missing tests.
- **Diff Size Management**: Intelligent patch truncation and total prompt size limits to stay within context windows and minimize API costs.
- **No File Copying Needed**: Can be integrated into any repository as a **reusable composite action** or a **reusable workflow**.

---

## Integration Guide

Integrating the AI PR Review Agent into any repository is quick and straightforward. You do not need to copy any script files to your repository.

### Step 1: Create a Workflow File
In the target repository, create a workflow file at `.github/workflows/pr-review.yml`. You can choose one of the following two integration methods:

#### Option A: Using the Composite Action (Recommended)
This method allows you to define custom runner types or run additional steps in the same job.

```yaml
name: AI PR Review

on:
  issue_comment:
    types: [created]

jobs:
  review:
    name: Run AI PR Review
    runs-on: ubuntu-latest

    # Only run for pull request comments containing the '/review-ai' command
    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/review-ai')

    steps:
      - name: Run AI Review Action
        uses: Harshit-3905/PR-Review-Agent@main
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          openai-model: 'gpt-4o' # Optional, defaults to gpt-4o
```

#### Option B: Using the Reusable Workflow
This method provides a simpler configuration.

```yaml
name: AI PR Review

on:
  issue_comment:
    types: [created]

jobs:
  review:
    name: Run AI PR Review
    
    # Only run for pull request comments containing the '/review-ai' command
    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/review-ai')

    uses: Harshit-3905/PR-Review-Agent/.github/workflows/reusable-review.yml@main
    with:
      openai-model: 'gpt-4o' # Optional, defaults to gpt-4o
    secrets:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Step 2: Set Up Secrets
To authenticate with the OpenAI API, you need to configure your repository secrets:
1. Navigate to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Add the following secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API secret key (e.g., `sk-proj-...`).

*(Note: The `GITHUB_TOKEN` is automatically provided by GitHub Actions and does not need to be manually added to Secrets.)*

### Step 3: Enable Action Permissions
Since the workflow needs to comment on the PR, ensure GitHub Actions has write permission:
1. Navigate to **Settings** -> **Actions** -> **General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Click **Save**.

---

## How It Works & Usage

Once integrated, using the agent is simple:

1. Open a Pull Request in your repository.
2. Post a comment on the PR containing the command:
   ```text
   /review-ai
   ```
3. The GitHub Actions workflow will trigger, analyze the diff of the changes, compile the review prompt, and query OpenAI.
4. The agent will post its code review as a comment directly on the PR thread.

---

## Configuration & Customization

If you want to customize the internal logic or build the action yourself:
- **AI Model**: Customize via the `openai-model` input in Option A or Option B.
- **System Instructions**: The core reviewing persona can be updated in `scripts/openai.ts`.
- **Prompt Structure**: Focus areas or language formatting instructions can be modified in `scripts/prompt.ts`.