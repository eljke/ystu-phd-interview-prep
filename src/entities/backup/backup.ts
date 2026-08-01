import type { Profile } from '../profile/profile';
import type {
  AppSettings,
  OralAttempt,
  PartnerAssessment,
  QuizAttempt,
  StudySession,
  TopicProgress,
} from '../progress/progress';

export interface BackupSnapshot {
  formatVersion: 1;
  exportedAt: string;
  contentVersion: string;
  checksum: string;
  profiles: Profile[];
  topicProgress: TopicProgress[];
  quizAttempts: QuizAttempt[];
  oralAttempts: OralAttempt[];
  partnerAssessments: PartnerAssessment[];
  studySessions: StudySession[];
  settings: AppSettings;
}
