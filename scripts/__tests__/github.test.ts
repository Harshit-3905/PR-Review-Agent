import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllowedRoles, checkReviewAuthorPermission } from '../github';
import type { OctokitType } from '../github';

describe('getAllowedRoles', () => {
  beforeEach(() => {
    delete process.env.REVIEW_ALLOWED_ROLES;
  });

  it('returns default roles when env var is not set', () => {
    const roles = getAllowedRoles();
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('write')).toBe(true);
    expect(roles.has('owner')).toBe(true);
    expect(roles.has('member')).toBe(true);
    expect(roles.has('collaborator')).toBe(true);
    expect(roles.has('read')).toBe(false);
    expect(roles.size).toBe(5);
  });

  it('aliases owner with admin for personal repo compatibility', () => {
    process.env.REVIEW_ALLOWED_ROLES = 'owner';
    const roles = getAllowedRoles();
    expect(roles.has('owner')).toBe(true);
    expect(roles.has('admin')).toBe(true);
    expect(roles.size).toBe(2);
  });

  it('aliases admin with owner bidirectionally', () => {
    process.env.REVIEW_ALLOWED_ROLES = 'admin';
    const roles = getAllowedRoles();
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('owner')).toBe(true);
    expect(roles.size).toBe(2);
  });

  it('parses comma-separated roles from env var', () => {
    process.env.REVIEW_ALLOWED_ROLES = 'owner,member,collaborator';
    const roles = getAllowedRoles();
    expect(roles.has('owner')).toBe(true);
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('member')).toBe(true);
    expect(roles.has('collaborator')).toBe(true);
    expect(roles.size).toBe(4);
  });

  it('trims whitespace around roles', () => {
    process.env.REVIEW_ALLOWED_ROLES = '  admin , write ';
    const roles = getAllowedRoles();
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('owner')).toBe(true);
    expect(roles.has('write')).toBe(true);
    expect(roles.size).toBe(3);
  });

  it('is case-insensitive', () => {
    process.env.REVIEW_ALLOWED_ROLES = 'OWNER,Admin';
    const roles = getAllowedRoles();
    expect(roles.has('owner')).toBe(true);
    expect(roles.has('admin')).toBe(true);
    expect(roles.size).toBe(2);
  });
});

describe('checkReviewAuthorPermission', () => {
  const owner = 'test-owner';
  const repo = 'test-repo';

  function mockOctokit(roleName: string): OctokitType {
    return {
      rest: {
        repos: {
          getCollaboratorPermissionLevel: vi.fn().mockResolvedValue({
            data: { role_name: roleName, permission: roleName },
          }),
        },
      },
    } as unknown as OctokitType;
  }

  beforeEach(() => {
    delete process.env.REVIEW_ALLOWED_ROLES;
  });

  it('allows a user with a role in the allowed set', async () => {
    process.env.REVIEW_ALLOWED_ROLES = 'admin,write';
    const octokit = mockOctokit('write');
    const result = await checkReviewAuthorPermission(octokit, owner, repo, 'collaborator-user');
    expect(result).toBe(true);
  });

  it('allows owner when role_name is admin (personal repo owner)', async () => {
    process.env.REVIEW_ALLOWED_ROLES = 'owner';
    const octokit = mockOctokit('admin');
    const result = await checkReviewAuthorPermission(octokit, owner, repo, 'repo-owner');
    expect(result).toBe(true);
  });

  it('denies a user with a role not in the allowed set', async () => {
    process.env.REVIEW_ALLOWED_ROLES = 'owner';
    const octokit = mockOctokit('read');
    const result = await checkReviewAuthorPermission(octokit, owner, repo, 'read-only-user');
    expect(result).toBe(false);
  });

  it('denies when the API call fails', async () => {
    process.env.REVIEW_ALLOWED_ROLES = 'admin';
    const octokit = {
      rest: {
        repos: {
          getCollaboratorPermissionLevel: vi.fn().mockRejectedValue(new Error('Not found')),
        },
      },
    } as unknown as OctokitType;
    const result = await checkReviewAuthorPermission(octokit, owner, repo, 'unknown-user');
    expect(result).toBe(false);
  });

  it('falls back to permission field when role_name is absent', async () => {
    process.env.REVIEW_ALLOWED_ROLES = 'admin';
    const octokit = {
      rest: {
        repos: {
          getCollaboratorPermissionLevel: vi.fn().mockResolvedValue({
            data: { role_name: undefined, permission: 'admin' },
          }),
        },
      },
    } as unknown as OctokitType;
    const result = await checkReviewAuthorPermission(octokit, owner, repo, 'admin-user');
    expect(result).toBe(true);
  });
});
