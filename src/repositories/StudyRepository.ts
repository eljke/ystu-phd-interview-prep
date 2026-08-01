import type { BackupSnapshot } from '../entities/backup/backup';
import type { Profile } from '../entities/profile/profile';
import type {
  AppSettings,
  OralAttempt,
  PartnerAssessment,
  QuizAttempt,
  StudySession,
  TopicProgress,
} from '../entities/progress/progress';

export interface StudyRepository {
  initialize(): Promise<void>;
  listProfiles(): Promise<Profile[]>;
  saveProfile(profile: Profile): Promise<void>;
  getTopicProgress(profileId: string, topicId: string): Promise<TopicProgress | undefined>;
  listTopicProgress(profileId: string): Promise<TopicProgress[]>;
  saveTopicProgress(progress: TopicProgress): Promise<void>;
  listQuizAttempts(profileId: string, topicId?: string): Promise<QuizAttempt[]>;
  saveQuizAttempt(attempt: QuizAttempt): Promise<void>;
  resetPracticeStatistics(profileId: string, topicId?: string): Promise<void>;
  listOralAttempts(profileId: string, topicId?: string): Promise<OralAttempt[]>;
  saveOralAttempt(attempt: OralAttempt): Promise<void>;
  listPartnerAssessments(profileId: string, topicId?: string): Promise<PartnerAssessment[]>;
  savePartnerAssessment(assessment: PartnerAssessment): Promise<void>;
  listStudySessions(): Promise<StudySession[]>;
  saveStudySession(session: StudySession): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  exportSnapshot(contentVersion: string): Promise<BackupSnapshot>;
  replaceSnapshot(snapshot: BackupSnapshot): Promise<void>;
}
