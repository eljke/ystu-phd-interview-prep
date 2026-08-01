import type { BackupSnapshot } from '../../entities/backup/backup';
import type { Profile } from '../../entities/profile/profile';
import type {
  AppSettings, OralAttempt, PartnerAssessment, QuizAttempt, StudySession, TopicProgress,
} from '../../entities/progress/progress';
import type { StudyRepository } from '../../repositories/StudyRepository';
import { mapStorageError } from './databaseErrors';
import { YstuDatabase } from './YstuDatabase';

const defaultSettings = (): AppSettings => ({ id:'app-settings', theme:'system', oralPreparationSeconds:20, oralAnswerSeconds:90, oralTimerEnabled:true, updatedAt:new Date().toISOString() });
const sorted = <T extends { completedAt: string }>(items: T[]) => items.sort((a,b)=>a.completedAt.localeCompare(b.completedAt));

export class DexieStudyRepository implements StudyRepository {
  constructor(private readonly db = new YstuDatabase()) {}
  async initialize() { try { await this.db.open(); if (!(await this.db.settings.get('app-settings'))) await this.db.settings.put(defaultSettings()); } catch(error) { throw mapStorageError(error); } }
  async listProfiles() { return this.db.profiles.orderBy('updatedAt').toArray(); }
  async saveProfile(profile: Profile) { await this.db.profiles.put(profile); }
  async getTopicProgress(profileId: string, topicId: string) { return this.db.topicProgress.where('[profileId+topicId]').equals([profileId,topicId]).first(); }
  async listTopicProgress(profileId: string) { return this.db.topicProgress.where('profileId').equals(profileId).toArray(); }
  async saveTopicProgress(progress: TopicProgress) { await this.db.topicProgress.put(progress); }
  async listQuizAttempts(profileId: string, topicId?: string) { const items=topicId ? await this.db.quizAttempts.where('[profileId+topicId]').equals([profileId,topicId]).toArray() : await this.db.quizAttempts.where('profileId').equals(profileId).toArray(); return sorted(items); }
  async saveQuizAttempt(attempt: QuizAttempt) { await this.db.quizAttempts.put(attempt); }
  async resetPracticeStatistics(profileId: string, topicId?: string) {
    const attempts = await this.db.quizAttempts.where('profileId').equals(profileId).toArray();
    const attemptIds = attempts
      .filter((attempt) => !topicId || attempt.topicId === topicId || attempt.questionResults?.some((item) => item.topicId === topicId))
      .map((attempt) => attempt.id);
    const progressIds = (await this.db.topicProgress.where('profileId').equals(profileId).toArray())
      .filter((item) => !topicId || item.topicId === topicId)
      .map((item) => item.id);
    await this.db.transaction('rw', [this.db.quizAttempts, this.db.topicProgress, this.db.syncOutbox], async () => {
      await Promise.all([
        this.db.quizAttempts.bulkDelete(attemptIds),
        this.db.topicProgress.bulkDelete(progressIds),
        this.db.syncOutbox.where('entityId').anyOf([...attemptIds, ...progressIds]).delete(),
      ]);
    });
  }
  async listOralAttempts(profileId: string, topicId?: string) { const items=topicId ? await this.db.oralAttempts.where('[profileId+topicId]').equals([profileId,topicId]).toArray() : await this.db.oralAttempts.where('profileId').equals(profileId).toArray(); return sorted(items); }
  async saveOralAttempt(attempt: OralAttempt) { await this.db.oralAttempts.put(attempt); }
  async listPartnerAssessments(profileId: string, topicId?: string) { const items=topicId ? await this.db.partnerAssessments.where('[responderProfileId+topicId]').equals([profileId,topicId]).toArray() : await this.db.partnerAssessments.where('responderProfileId').equals(profileId).toArray(); return sorted(items); }
  async savePartnerAssessment(assessment: PartnerAssessment) { await this.db.partnerAssessments.put(assessment); }
  async listStudySessions() { return this.db.studySessions.orderBy('startedAt').toArray(); }
  async saveStudySession(session: StudySession) { await this.db.studySessions.put(session); }
  async getSettings() { return (await this.db.settings.get('app-settings')) ?? defaultSettings(); }
  async saveSettings(settings: AppSettings) { await this.db.settings.put(settings); }
  async exportSnapshot(contentVersion: string): Promise<BackupSnapshot> { return { formatVersion:1, exportedAt:new Date().toISOString(), contentVersion, checksum:'pending', profiles:await this.db.profiles.toArray(), topicProgress:await this.db.topicProgress.toArray(), quizAttempts:await this.db.quizAttempts.toArray(), oralAttempts:await this.db.oralAttempts.toArray(), partnerAssessments:await this.db.partnerAssessments.toArray(), studySessions:await this.db.studySessions.toArray(), settings:await this.getSettings() }; }
  async replaceSnapshot(snapshot: BackupSnapshot) { await this.db.transaction('rw', [this.db.profiles,this.db.topicProgress,this.db.quizAttempts,this.db.oralAttempts,this.db.partnerAssessments,this.db.studySessions,this.db.settings], async()=>{ await Promise.all([this.db.profiles.clear(),this.db.topicProgress.clear(),this.db.quizAttempts.clear(),this.db.oralAttempts.clear(),this.db.partnerAssessments.clear(),this.db.studySessions.clear(),this.db.settings.clear()]); await Promise.all([this.db.profiles.bulkPut(snapshot.profiles),this.db.topicProgress.bulkPut(snapshot.topicProgress),this.db.quizAttempts.bulkPut(snapshot.quizAttempts),this.db.oralAttempts.bulkPut(snapshot.oralAttempts),this.db.partnerAssessments.bulkPut(snapshot.partnerAssessments),this.db.studySessions.bulkPut(snapshot.studySessions),this.db.settings.put(snapshot.settings)]); }); }
}
