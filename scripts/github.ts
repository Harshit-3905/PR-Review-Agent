import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { PRFile } from './types/github';

export type OctokitType = ReturnType<typeof getOctokit>;

/**
 * Returns an initialized Octokit client using the provided token.
 */
export function getOctokitClient(token: string): OctokitType {
  return getOctokit(token);
}

/**
 * Extracts and returns necessary metadata from the GitHub Actions context.
 * Throws an error if the context is not a pull request issue comment.
 */
export function getPRContext() {
  const prNumber = context.payload.issue?.number;
  if (!prNumber) {
    throw new Error('Could not find issue number in context. This workflow might not be triggered by an issue comment.');
  }

  const isPullRequest = !!context.payload.issue?.pull_request;
  if (!isPullRequest) {
    throw new Error('This comment is not on a pull request. AI review is only supported for pull requests.');
  }

  const { owner, repo } = context.repo;
  const commentBody = context.payload.comment?.body || '';
  const commentId = context.payload.comment?.id;
  const commentAuthor = context.payload.comment?.user?.login || '';

  return {
    prNumber,
    owner,
    repo,
    commentBody,
    commentId,
    commentAuthor,
  };
}

export function getAllowedRoles(): Set<string> {
  const raw = process.env.REVIEW_ALLOWED_ROLES || 'admin,write,owner,member,collaborator';
  const roles = new Set(raw.split(',').map((r) => r.trim().toLowerCase()));
  // On personal repos, GitHub returns role_name "admin" for the owner.
  // Treat "owner" as equivalent to "admin" so REVIEW_ALLOWED_ROLES=owner works for both org and personal repos.
  if (roles.has('owner')) roles.add('admin');
  if (roles.has('admin')) roles.add('owner');
  return roles;
}

export async function checkReviewAuthorPermission(
  octokit: OctokitType,
  owner: string,
  repo: string,
  commentAuthor: string
): Promise<boolean> {
  const allowedRoles = getAllowedRoles();

  try {
    const { data: permission } = await octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: commentAuthor,
    });

    const roleName = (permission.role_name || permission.permission || '').toLowerCase();
    return allowedRoles.has(roleName);
  } catch {
    return false;
  }
}

/**
 * Fetches the list of files and their patches changed in a pull request.
 */
export async function fetchPRFiles(
  octokit: OctokitType,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PRFile[]> {
  try {
    // GitHub listFiles endpoint paginates up to 3000 files. We fetch the first page (max 100 files)
    // which is usually sufficient for a PR code review.
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    return files.map((file) => ({
      filename: file.filename,
      patch: file.patch, // patch may be undefined for binary files or large files
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch PR files: ${error.message || error}`);
  }
}

/**
 * Creates a comment on the pull request (which is technically an issue).
 */
export async function createPRComment(
  octokit: OctokitType,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  try {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  } catch (error: any) {
    throw new Error(`Failed to create PR comment: ${error.message || error}`);
  }
}

/**
 * Adds a reaction emoji to an issue comment.
 */
export async function addCommentReaction(
  octokit: OctokitType,
  owner: string,
  repo: string,
  commentId: number,
  content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'
): Promise<void> {
  try {
    await octokit.rest.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: commentId,
      content,
    });
  } catch (error: any) {
    core.warning(`Failed to add reaction to comment: ${error.message || error}`);
  }
}
