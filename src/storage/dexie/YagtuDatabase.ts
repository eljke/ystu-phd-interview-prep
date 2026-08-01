import Dexie, { type Table } from 'dexie';
import type { Profile } from '../../entities/profile/profile';
import type {
  AppSettings,
  OralAttempt,
  PartnerAssessment,
  QuizAttempt,
  StudySession,
  TopicProgress,
} from '../../entities/progress/progress';

export class YagtuDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  topicProgress!: Table<TopicProgress, string>;
  quizAttempts!: Table<QuizAttempt, string>;
  oralAttempts!: Table<OralAttempt, string>;
  partnerAssessments!: Table<PartnerAssessment, string>;
  studySessions!: Table<StudySession, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = 'yagtu-interview-prep') {
    super(name);
    this.version(1).stores({
      profiles: 'id, updatedAt',
      topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt',
      quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      partnerAssessments: 'id, [responderProfileId+topicId], responderProfileId, reviewerProfileId, topicId, completedAt',
      studySessions: 'id, startedAt, completedAt',
      settings: 'id',
    });
  }
}
