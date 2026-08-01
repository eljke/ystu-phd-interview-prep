export type TopicStatus = 'not-started' | 'studying' | 'can-answer' | 'mastered' | 'needs-review';

export type ViewedSection =
  | 'shortAnswer'
  | 'extendedAnswer'
  | 'keyPoints'
  | 'formulas'
  | 'example'
  | 'commonMistakes';

export interface TopicProgress {
  id: string;
  profileId: string;
  topicId: string;
  viewedSections: ViewedSection[];
  manualReview: boolean;
  status: TopicStatus;
  masteryScore: number;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  profileId: string;
  topicId: string;
  correct: number;
  total: number;
  score: number;
  answers: Record<string, unknown>;
  completedAt: string;
  updatedAt: string;
}

export type OralCriterionResult = 'covered' | 'partial' | 'missed';

export interface OralAttempt {
  id: string;
  profileId: string;
  topicId: string;
  selfConfidence: number;
  oralScore: number;
  criteria: Array<{ criterionId: string; result: OralCriterionResult }>;
  startedAt: string;
  completedAt: string;
  updatedAt: string;
}

export interface PartnerAssessment {
  id: string;
  oralAttemptId: string;
  responderProfileId: string;
  reviewerProfileId: string;
  topicId: string;
  score: number;
  criteria: Array<{ criterionId: string; result: OralCriterionResult }>;
  notes?: string;
  completedAt: string;
  updatedAt: string;
}

export type StudySessionMode =
  | 'selected'
  | 'random-section'
  | 'responder-weak'
  | 'pair-weak'
  | 'mock-interview';

export interface StudySession {
  id: string;
  mode: StudySessionMode;
  participantIds: [string, string];
  topicIds: string[];
  attemptIds: string[];
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'app-settings';
  activeProfileId?: string;
  theme: 'light' | 'dark' | 'system';
  oralPreparationSeconds: number;
  oralAnswerSeconds: number;
  oralTimerEnabled: boolean;
  updatedAt: string;
}
