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
