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
import type { StudyRepository } from '../../repositories/StudyRepository';

const clone = <T>(value: T): T => structuredClone(value);
const defaultSettings = (): AppSettings => ({
  id: 'app-settings', theme: 'system', oralPreparationSeconds: 20, oralAnswerSeconds: 90,
  oralTimerEnabled: true, updatedAt: new Date().toISOString(),
});

export class MemoryStudyRepository implements StudyRepository {
  private profiles = new Map<string, Profile>();
  private progress = new Map<string, TopicProgress>();
  private quizzes = new Map<string, QuizAttempt>();
  private oral = new Map<string, OralAttempt>();
  private assessments = new Map<string, PartnerAssessment>();
  private sessions = new Map<string, StudySession>();
  private settings = defaultSettings();

  async initialize() { return Promise.resolve(); }
  async listProfiles() { return clone([...this.profiles.values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))); }
  async saveProfile(profile: Profile) { this.profiles.set(profile.id, clone(profile)); }
  async getTopicProgress(profileId: string, topicId: string) { const item=[...this.progress.values()].find((p)=>p.profileId===profileId&&p.topicId===topicId); return item ? clone(item) : undefined; }
  async listTopicProgress(profileId: string) { return clone([...this.progress.values()].filter((p)=>p.profileId===profileId)); }
  async saveTopicProgress(progress: TopicProgress) { this.progress.set(progress.id, clone(progress)); }
  async listQuizAttempts(profileId: string, topicId?: string) { return clone([...this.quizzes.values()].filter((a)=>a.profileId===profileId&&(!topicId||a.topicId===topicId)).sort((a,b)=>a.completedAt.localeCompare(b.completedAt))); }
  async saveQuizAttempt(attempt: QuizAttempt) { this.quizzes.set(attempt.id, clone(attempt)); }
  async resetPracticeStatistics(profileId: string, topicId?: string) {
    for (const [id, attempt] of this.quizzes) {
      const coversTopic = attempt.topicId === topicId || attempt.questionResults?.some((item) => item.topicId === topicId);
      if (attempt.profileId === profileId && (!topicId || coversTopic)) this.quizzes.delete(id);
    }
    for (const [id, progress] of this.progress) {
      if (progress.profileId === profileId && (!topicId || progress.topicId === topicId)) this.progress.delete(id);
    }
  }
  async listOralAttempts(profileId: string, topicId?: string) { return clone([...this.oral.values()].filter((a)=>a.profileId===profileId&&(!topicId||a.topicId===topicId)).sort((a,b)=>a.completedAt.localeCompare(b.completedAt))); }
  async saveOralAttempt(attempt: OralAttempt) { this.oral.set(attempt.id, clone(attempt)); }
  async listPartnerAssessments(profileId: string, topicId?: string) { return clone([...this.assessments.values()].filter((a)=>a.responderProfileId===profileId&&(!topicId||a.topicId===topicId)).sort((a,b)=>a.completedAt.localeCompare(b.completedAt))); }
  async savePartnerAssessment(assessment: PartnerAssessment) { this.assessments.set(assessment.id, clone(assessment)); }
  async listStudySessions() { return clone([...this.sessions.values()].sort((a,b)=>a.startedAt.localeCompare(b.startedAt))); }
  async saveStudySession(session: StudySession) { this.sessions.set(session.id, clone(session)); }
  async getSettings() { return clone(this.settings); }
  async saveSettings(settings: AppSettings) { this.settings=clone(settings); }
  async exportSnapshot(contentVersion: string): Promise<BackupSnapshot> {
    return { formatVersion:1, exportedAt:new Date().toISOString(), contentVersion, checksum:'pending', profiles:await this.listProfiles(), topicProgress:clone([...this.progress.values()]), quizAttempts:clone([...this.quizzes.values()]), oralAttempts:clone([...this.oral.values()]), partnerAssessments:clone([...this.assessments.values()]), studySessions:await this.listStudySessions(), settings:await this.getSettings() };
  }
  async replaceSnapshot(snapshot: BackupSnapshot) {
    this.profiles=new Map(snapshot.profiles.map((x)=>[x.id,clone(x)]));
    this.progress=new Map(snapshot.topicProgress.map((x)=>[x.id,clone(x)]));
    this.quizzes=new Map(snapshot.quizAttempts.map((x)=>[x.id,clone(x)]));
    this.oral=new Map(snapshot.oralAttempts.map((x)=>[x.id,clone(x)]));
    this.assessments=new Map(snapshot.partnerAssessments.map((x)=>[x.id,clone(x)]));
    this.sessions=new Map(snapshot.studySessions.map((x)=>[x.id,clone(x)]));
    this.settings=clone(snapshot.settings);
  }
}
