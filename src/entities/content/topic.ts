export type TopicSection =
  | 'mathematical-modeling'
  | 'numerical-methods'
  | 'software-complexes';

export interface KeyPoint {
  id: string;
  title: string;
  explanation: string;
}

export interface FormulaBlock {
  id: string;
  latex: string;
  plainText: string;
  explanation: string;
}

export interface OralCriterion {
  id: string;
  label: string;
  critical: boolean;
}

export interface TopicSource {
  title: string;
  url: string;
  supports: string[];
}

interface QuizQuestionBase {
  id: string;
  prompt: string;
  explanation: string;
  keyPointIds: string[];
}

export interface SingleChoiceQuestion extends QuizQuestionBase {
  type: 'single-choice';
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: 'multiple-choice';
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
}

export interface MatchingQuestion extends QuizQuestionBase {
  type: 'matching';
  left: Array<{ id: string; text: string }>;
  right: Array<{ id: string; text: string }>;
  pairs: Record<string, string>;
}

export interface OrderingQuestion extends QuizQuestionBase {
  type: 'ordering';
  items: Array<{ id: string; text: string }>;
  correctOrder: string[];
}

export interface FillBlankQuestion extends QuizQuestionBase {
  type: 'fill-blank';
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | OrderingQuestion
  | FillBlankQuestion;

export interface Topic {
  id: string;
  code: string;
  section: TopicSection;
  originalText: string;
  shortAnswer: string;
  extendedAnswer: string;
  keyPoints: KeyPoint[];
  formulas: FormulaBlock[];
  example?: string;
  commonMistakes: string[];
  oralChecklist: OralCriterion[];
  quiz: QuizQuestion[];
  sources: TopicSource[];
  sourceNote?: string;
}

export const SECTION_LABELS: Record<TopicSection, string> = {
  'mathematical-modeling': 'Математическое моделирование',
  'numerical-methods': 'Численные методы',
  'software-complexes': 'Комплексы программ',
};
