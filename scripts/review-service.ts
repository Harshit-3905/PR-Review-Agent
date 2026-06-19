import type { PRFile } from './github';

export interface ReviewServiceDependencies {
  addEyesReaction(): Promise<void>;
  fetchPRFiles(): Promise<PRFile[]>;
  postComment(body: string): Promise<void>;
  generateReview(prompt: string): Promise<string>;
  compilePrompt(files: PRFile[]): string;
  providerName: string;
  model: string;
}

export interface ReviewResult {
  reviewBody: string;
  filesChanged: number;
  promptSize: number;
}

export class ReviewService {
  constructor(private deps: ReviewServiceDependencies) {}

  async run(): Promise<ReviewResult> {
    await this.deps.addEyesReaction();

    const files = await this.deps.fetchPRFiles();

    if (files.length === 0) {
      const msg = '🤖 AI Review Agent: No code changes found to review.';
      await this.deps.postComment(msg);
      return { reviewBody: msg, filesChanged: 0, promptSize: 0 };
    }

    const prompt = this.deps.compilePrompt(files);
    const reviewBody = await this.deps.generateReview(prompt);

    await this.deps.postComment(reviewBody);

    return { reviewBody, filesChanged: files.length, promptSize: prompt.length };
  }
}
