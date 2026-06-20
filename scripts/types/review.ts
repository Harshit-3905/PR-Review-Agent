import type { PRFile } from './github';

export interface ReviewFinding {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Nit';
  category: 'Bugs' | 'Security' | 'Performance' | 'Testing' | 'Style' | 'Maintainability';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface StructuredReview {
  summary: string;
  findings: ReviewFinding[];
}

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
