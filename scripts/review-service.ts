import type { ReviewServiceDependencies, ReviewResult } from './types/review';
import { parseStructuredReview, formatStructuredReview } from './structured-review';

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
    const rawReview = await this.deps.generateReview(prompt);

    const structured = parseStructuredReview(rawReview);
    const formattedBody = structured ? formatStructuredReview(structured) : rawReview;
    const bodyWithFooter = `${formattedBody}\n\n---\n_Reviewed using ${this.deps.providerName}/${this.deps.model}_`;

    await this.deps.postComment(bodyWithFooter);

    return { reviewBody: bodyWithFooter, filesChanged: files.length, promptSize: prompt.length };
  }
}
