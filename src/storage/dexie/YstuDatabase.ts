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
import type { SyncOperation } from '../../repositories/CloudStudyRepository';

export interface UserBinding {
  userId: string;
  localProfileId: string;
  migratedAt: string;
}

export class YstuDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  topicProgress!: Table<TopicProgress, string>;
  quizAttempts!: Table<QuizAttempt, string>;
  oralAttempts!: Table<OralAttempt, string>;
  partnerAssessments!: Table<PartnerAssessment, string>;
  studySessions!: Table<StudySession, string>;
  settings!: Table<AppSettings, string>;
  migrations!: Table<{ id: string }, string>;
  syncOutbox!: Table<SyncOperation, string>;
  userBindings!: Table<UserBinding, string>;

  constructor(name = 'ystu-interview-prep') {
    super(name);
    this.version(1).stores({
      profiles: 'id, updatedAt',
      topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt',
      quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      partnerAssessments:
        'id, [responderProfileId+topicId], responderProfileId, reviewerProfileId, topicId, completedAt',
      studySessions: 'id, startedAt, completedAt',
      settings: 'id',
      migrations: 'id',
    });
    this.version(2).stores({
      profiles: 'id, updatedAt',
      topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt',
      quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      partnerAssessments:
        'id, [responderProfileId+topicId], responderProfileId, reviewerProfileId, topicId, completedAt',
      studySessions: 'id, startedAt, completedAt',
      settings: 'id',
      migrations: 'id',
      syncOutbox: 'id, createdAt, entity, entityId',
      userBindings: 'userId, localProfileId',
    });
    this.on('ready', () => this.migrateLegacyYagtuDatabase());
  }

  async migrateLegacyYagtuDatabase() {
    if (await this.migrations.get('legacy-yagtu')) return;
    if (!(await Dexie.exists('yagtu-interview-prep'))) {
      await this.migrations.put({ id: 'legacy-yagtu' });
      return;
    }

    const legacy = new Dexie('yagtu-interview-prep');
    legacy.version(1).stores({
      profiles: 'id, updatedAt',
      topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt',
      quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
      partnerAssessments:
        'id, [responderProfileId+topicId], responderProfileId, reviewerProfileId, topicId, completedAt',
      studySessions: 'id, startedAt, completedAt',
      settings: 'id',
    });

    try {
      await legacy.open();
      const [
        profiles,
        topicProgress,
        quizAttempts,
        oralAttempts,
        partnerAssessments,
        studySessions,
        settings,
      ] = await Promise.all([
        legacy.table<Profile, string>('profiles').toArray(),
        legacy.table<TopicProgress, string>('topicProgress').toArray(),
        legacy.table<QuizAttempt, string>('quizAttempts').toArray(),
        legacy.table<OralAttempt, string>('oralAttempts').toArray(),
        legacy.table<PartnerAssessment, string>('partnerAssessments').toArray(),
        legacy.table<StudySession, string>('studySessions').toArray(),
        legacy.table<AppSettings, string>('settings').toArray(),
      ]);

      await this.transaction(
        'rw',
        [
          this.profiles,
          this.topicProgress,
          this.quizAttempts,
          this.oralAttempts,
          this.partnerAssessments,
          this.studySessions,
          this.settings,
          this.migrations,
        ],
        async () => {
          await Promise.all([
            this.profiles.bulkPut(profiles),
            this.topicProgress.bulkPut(topicProgress),
            this.quizAttempts.bulkPut(quizAttempts),
            this.oralAttempts.bulkPut(oralAttempts),
            this.partnerAssessments.bulkPut(partnerAssessments),
            this.studySessions.bulkPut(studySessions),
            this.settings.bulkPut(settings),
          ]);
          await this.migrations.put({ id: 'legacy-yagtu' });
        },
      );
    } finally {
      legacy.close();
    }
  }
}
