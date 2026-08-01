import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryStudyRepository } from '../../storage/memory/MemoryStudyRepository';
import { YstuDatabase } from '../../storage/dexie/YstuDatabase';
import { migrateLegacyProfile, previewLegacyProfile } from './legacyDataMigration';

const databaseName = 'migration-test';

afterEach(async () => {
  await Dexie.delete(databaseName);
});

describe('legacy data migration', () => {
  it('copies one selected profile without deleting either local profile', async () => {
    const repository = new MemoryStudyRepository();
    const db = new YstuDatabase(databaseName);
    await Promise.all([repository.initialize(), db.open()]);
    await repository.saveProfile({
      id: 'local-a',
      name: 'Анна',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    });
    await repository.saveProfile({
      id: 'local-b',
      name: 'Борис',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    });
    await repository.saveTopicProgress({
      id: 'local-a:topic-1',
      profileId: 'local-a',
      topicId: 'topic-1',
      viewedSections: ['shortAnswer'],
      manualReview: false,
      status: 'studying',
      masteryScore: 0.2,
      updatedAt: '2026-08-01T11:00:00.000Z',
    });

    expect(await previewLegacyProfile(repository, 'local-a')).toMatchObject({
      profileName: 'Анна',
      progressCount: 1,
    });
    await migrateLegacyProfile(repository, db, 'local-a', 'github-user-1', 'anna-gh');

    expect((await repository.listProfiles()).map((profile) => profile.id)).toEqual([
      'local-a',
      'local-b',
      'github-user-1',
    ]);
    expect((await repository.listProfiles()).find((profile) => profile.id === 'github-user-1'))
      .toMatchObject({ name: 'anna-gh' });
    expect(await repository.getTopicProgress('github-user-1', 'topic-1')).toMatchObject({
      id: 'github-user-1:topic-1',
      profileId: 'github-user-1',
    });
    expect(await db.syncOutbox.count()).toBe(1);
    expect(await db.userBindings.get('github-user-1')).toMatchObject({ localProfileId: 'local-a' });
    db.close();
  });
});
