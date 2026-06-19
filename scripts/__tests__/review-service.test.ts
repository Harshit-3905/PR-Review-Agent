import { describe, it, expect, vi } from 'vitest';
import { ReviewService, type ReviewServiceDependencies } from '../review-service';

function makeDeps(overrides: Partial<ReviewServiceDependencies> = {}): ReviewServiceDependencies {
  return {
    addEyesReaction: vi.fn().mockResolvedValue(undefined),
    fetchPRFiles: vi.fn().mockResolvedValue([]),
    postComment: vi.fn().mockResolvedValue(undefined),
    generateReview: vi.fn().mockResolvedValue('Great review!'),
    compilePrompt: vi.fn().mockReturnValue('compiled prompt'),
    providerName: 'openrouter',
    model: 'test-model',
    ...overrides,
  };
}

describe('ReviewService', () => {
  describe('run', () => {
    it('adds eyes reaction when commentId is provided', async () => {
      const addEyesReaction = vi.fn().mockResolvedValue(undefined);
      const deps = makeDeps({ addEyesReaction, fetchPRFiles: vi.fn().mockResolvedValue([{ filename: 'a.ts', patch: '+1' }]) });
      const service = new ReviewService(deps);

      await service.run();

      expect(addEyesReaction).toHaveBeenCalledOnce();
    });

    it('fetches PR files', async () => {
      const fetchPRFiles = vi.fn().mockResolvedValue([{ filename: 'a.ts', patch: '+1' }]);
      const deps = makeDeps({ fetchPRFiles });
      const service = new ReviewService(deps);

      await service.run();

      expect(fetchPRFiles).toHaveBeenCalledOnce();
    });

    it('returns early with a message when there are no changed files', async () => {
      const fetchPRFiles = vi.fn().mockResolvedValue([]);
      const postComment = vi.fn().mockResolvedValue(undefined);
      const deps = makeDeps({ fetchPRFiles, postComment });
      const service = new ReviewService(deps);

      const result = await service.run();

      expect(result.filesChanged).toBe(0);
      expect(result.promptSize).toBe(0);
      expect(result.reviewBody).toContain('No code changes found');
      expect(postComment).toHaveBeenCalledWith(expect.stringContaining('No code changes found'));
      expect(deps.compilePrompt).not.toHaveBeenCalled();
      expect(deps.generateReview).not.toHaveBeenCalled();
    });

    it('compiles the prompt from fetched files', async () => {
      const files = [{ filename: 'a.ts', patch: '+1' }];
      const compilePrompt = vi.fn().mockReturnValue('compiled prompt body');
      const deps = makeDeps({ fetchPRFiles: vi.fn().mockResolvedValue(files), compilePrompt });
      const service = new ReviewService(deps);

      await service.run();

      expect(compilePrompt).toHaveBeenCalledWith(files);
    });

    it('generates a review with the compiled prompt', async () => {
      const compilePrompt = vi.fn().mockReturnValue('compiled prompt body');
      const generateReview = vi.fn().mockResolvedValue('AI review output');
      const deps = makeDeps({
        fetchPRFiles: vi.fn().mockResolvedValue([{ filename: 'a.ts', patch: '+1' }]),
        compilePrompt,
        generateReview,
      });
      const service = new ReviewService(deps);

      await service.run();

      expect(generateReview).toHaveBeenCalledWith('compiled prompt body');
    });

    it('posts the generated review as a comment', async () => {
      const postComment = vi.fn().mockResolvedValue(undefined);
      const generateReview = vi.fn().mockResolvedValue('AI review output');
      const deps = makeDeps({
        fetchPRFiles: vi.fn().mockResolvedValue([{ filename: 'a.ts', patch: '+1' }]),
        postComment,
        generateReview,
      });
      const service = new ReviewService(deps);

      await service.run();

      expect(postComment).toHaveBeenCalledWith('AI review output');
    });

    it('returns correct result metadata', async () => {
      const compilePrompt = vi.fn().mockReturnValue('a'.repeat(42));
      const deps = makeDeps({
        fetchPRFiles: vi.fn().mockResolvedValue([
          { filename: 'a.ts', patch: '+1' },
          { filename: 'b.ts', patch: '-1' },
        ]),
        compilePrompt,
        generateReview: vi.fn().mockResolvedValue('review body'),
      });
      const service = new ReviewService(deps);

      const result = await service.run();

      expect(result).toEqual({
        reviewBody: 'review body',
        filesChanged: 2,
        promptSize: 42,
      });
    });
  });
});
