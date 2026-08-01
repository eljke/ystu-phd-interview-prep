import type { BackupSnapshot } from '../../entities/backup/backup';
import type { Profile } from '../../entities/profile/profile';
import type {
  AppSettings,
  OralAttempt,
  PartnerAssessment,
  QuizAttempt,
  StudySession,
  TopicProgress,
} from '../../entities/progress/progress';
import type {
  CloudStudyRepository,
  SyncEntity,
  SyncOperation,
} from '../../repositories/CloudStudyRepository';
import type { StudyRepository } from '../../repositories/StudyRepository';
import type { SyncOutboxStore } from '../dexie/SyncOutbox';

export interface SyncSummary {
  sent: number;
  pending: number;
}

export class SyncingStudyRepository implements StudyRepository {
  constructor(
    private readonly local: StudyRepository,
    private readonly cloud: CloudStudyRepository,
    private readonly outbox: SyncOutboxStore,
    private readonly profileId: string,
  ) {}

  async initialize() {
    await this.local.initialize();
    await this.flushOutbox();
    try {
      const remote = await this.cloud.pull(this.profileId);
      await Promise.all([
        ...remote.topicProgress.map((item) => this.local.saveTopicProgress(item)),
        ...remote.quizAttempts.map((item) => this.local.saveQuizAttempt(item)),
        ...remote.oralAttempts.map((item) => this.local.saveOralAttempt(item)),
      ]);
    } catch {
      // The local cache remains usable; queued writes retry on the next mutation/start.
    }
  }

  async flushOutbox(): Promise<SyncSummary> {
    let sent = 0;
    for (const operation of await this.outbox.list()) {
      try {
        await this.cloud.apply(operation);
        await this.outbox.remove(operation.id);
        sent += 1;
      } catch {
        break;
      }
    }
    return { sent, pending: (await this.outbox.list()).length };
  }

  private async enqueue(
    entity: SyncEntity,
    entityId: string,
    payload: TopicProgress | QuizAttempt | OralAttempt,
  ) {
    const operation: SyncOperation = {
      id: `${entity}:${entityId}`,
      entity,
      entityId,
      operation: 'upsert',
      payload,
      createdAt: new Date().toISOString(),
    };
    await this.outbox.put(operation);
    await this.flushOutbox();
  }

  async listProfiles(): Promise<Profile[]> {
    return (await this.local.listProfiles()).filter((profile) => profile.id === this.profileId);
  }
  saveProfile(profile: Profile): Promise<void> {
    return this.local.saveProfile(profile);
  }
  getTopicProgress(profileId: string, topicId: string) {
    return this.local.getTopicProgress(profileId, topicId);
  }
  listTopicProgress(profileId: string) {
    return this.local.listTopicProgress(profileId);
  }
  async saveTopicProgress(progress: TopicProgress) {
    await this.local.saveTopicProgress(progress);
    await this.enqueue('topic-progress', progress.id, progress);
  }
  listQuizAttempts(profileId: string, topicId?: string) {
    return this.local.listQuizAttempts(profileId, topicId);
  }
  async saveQuizAttempt(attempt: QuizAttempt) {
    await this.local.saveQuizAttempt(attempt);
    await this.enqueue('quiz-attempt', attempt.id, attempt);
  }
  async resetPracticeStatistics(profileId: string, topicId?: string) {
    const attempts = await this.local.listQuizAttempts(profileId);
    const attemptIds = attempts
      .filter((attempt) => !topicId || attempt.topicId === topicId || attempt.questionResults?.some((item) => item.topicId === topicId))
      .map((attempt) => attempt.id);
    await this.cloud.resetPracticeStatistics(topicId, attemptIds);
    await this.local.resetPracticeStatistics(profileId, topicId);
  }
  listOralAttempts(profileId: string, topicId?: string) {
    return this.local.listOralAttempts(profileId, topicId);
  }
  async saveOralAttempt(attempt: OralAttempt) {
    await this.local.saveOralAttempt(attempt);
    await this.enqueue('oral-attempt', attempt.id, attempt);
  }
  listPartnerAssessments(profileId: string, topicId?: string) {
    return this.local.listPartnerAssessments(profileId, topicId);
  }
  savePartnerAssessment(assessment: PartnerAssessment) {
    return this.local.savePartnerAssessment(assessment);
  }
  listStudySessions(): Promise<StudySession[]> {
    return this.local.listStudySessions();
  }
  saveStudySession(session: StudySession): Promise<void> {
    return this.local.saveStudySession(session);
  }
  getSettings(): Promise<AppSettings> {
    return this.local.getSettings();
  }
  saveSettings(settings: AppSettings): Promise<void> {
    return this.local.saveSettings(settings);
  }
  async exportSnapshot(contentVersion: string): Promise<BackupSnapshot> {
    const snapshot = await this.local.exportSnapshot(contentVersion);
    return {
      ...snapshot,
      formatVersion: 2,
      profiles: snapshot.profiles.filter((profile) => profile.id === this.profileId),
      topicProgress: snapshot.topicProgress.filter((item) => item.profileId === this.profileId),
      quizAttempts: snapshot.quizAttempts.filter((item) => item.profileId === this.profileId),
      oralAttempts: snapshot.oralAttempts.filter((item) => item.profileId === this.profileId),
      partnerAssessments: [],
      studySessions: [],
      settings: { ...snapshot.settings, activeProfileId: this.profileId },
    };
  }
  replaceSnapshot(snapshot: BackupSnapshot): Promise<void> {
    return this.local.replaceSnapshot(snapshot);
  }
}
