import type { StudyRepository } from '../../repositories/StudyRepository';
import type { SyncOperation } from '../../repositories/CloudStudyRepository';
import type { YstuDatabase } from '../../storage/dexie/YstuDatabase';

export interface MigrationPreview {
  profileId: string;
  profileName: string;
  progressCount: number;
  quizCount: number;
  oralCount: number;
}

export async function previewLegacyProfile(
  repository: StudyRepository,
  profileId: string,
): Promise<MigrationPreview> {
  const profile = (await repository.listProfiles()).find((item) => item.id === profileId);
  if (!profile) throw new Error('Локальный профиль не найден.');
  const [progress, quizzes, oral] = await Promise.all([
    repository.listTopicProgress(profileId),
    repository.listQuizAttempts(profileId),
    repository.listOralAttempts(profileId),
  ]);
  return {
    profileId,
    profileName: profile.name,
    progressCount: progress.length,
    quizCount: quizzes.length,
    oralCount: oral.length,
  };
}

export async function migrateLegacyProfile(
  repository: StudyRepository,
  db: YstuDatabase,
  localProfileId: string | null,
  userId: string,
  githubLogin: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (!localProfileId) {
    await repository.saveProfile({ id: userId, name: githubLogin, createdAt: now, updatedAt: now });
  } else {
    const preview = await previewLegacyProfile(repository, localProfileId);
    const [progress, quizzes, oral] = await Promise.all([
      repository.listTopicProgress(localProfileId),
      repository.listQuizAttempts(localProfileId),
      repository.listOralAttempts(localProfileId),
    ]);
    await repository.saveProfile({
      id: userId,
      name: preview.profileName,
      createdAt: now,
      updatedAt: now,
    });
    await Promise.all([
      ...progress.map((item) =>
        repository.saveTopicProgress({
          ...item,
          id: `${userId}:${item.topicId}`,
          profileId: userId,
        }),
      ),
      ...quizzes.map((item) => repository.saveQuizAttempt({ ...item, profileId: userId })),
      ...oral.map((item) => repository.saveOralAttempt({ ...item, profileId: userId })),
    ]);
    const operations: SyncOperation[] = [
      ...progress.map((item) => {
        const payload = { ...item, id: `${userId}:${item.topicId}`, profileId: userId };
        return {
          id: `topic-progress:${payload.id}`,
          entity: 'topic-progress' as const,
          entityId: payload.id,
          operation: 'upsert' as const,
          payload,
          createdAt: now,
        };
      }),
      ...quizzes.map((item) => ({
        id: `quiz-attempt:${item.id}`,
        entity: 'quiz-attempt' as const,
        entityId: item.id,
        operation: 'upsert' as const,
        payload: { ...item, profileId: userId },
        createdAt: now,
      })),
      ...oral.map((item) => ({
        id: `oral-attempt:${item.id}`,
        entity: 'oral-attempt' as const,
        entityId: item.id,
        operation: 'upsert' as const,
        payload: { ...item, profileId: userId },
        createdAt: now,
      })),
    ];
    await db.syncOutbox.bulkPut(operations);
  }
  const settings = await repository.getSettings();
  await repository.saveSettings({ ...settings, activeProfileId: userId, updatedAt: now });
  await db.userBindings.put({ userId, localProfileId: localProfileId ?? userId, migratedAt: now });
}
