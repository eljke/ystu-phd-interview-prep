import type { OralAttempt, QuizAttempt, TopicProgress } from '../entities/progress/progress';

export type SyncEntity = 'topic-progress' | 'quiz-attempt' | 'oral-attempt';

export interface SyncOperation {
  id: string;
  entity: SyncEntity;
  entityId: string;
  operation: 'upsert';
  payload: TopicProgress | QuizAttempt | OralAttempt;
  createdAt: string;
}

export interface CloudSnapshot {
  topicProgress: TopicProgress[];
  quizAttempts: QuizAttempt[];
  oralAttempts: OralAttempt[];
}

export interface CloudStudyRepository {
  pull(profileId: string): Promise<CloudSnapshot>;
  apply(operation: SyncOperation): Promise<void>;
}
