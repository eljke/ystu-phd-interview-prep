import Dexie from 'dexie';
import { afterEach, expect, it } from 'vitest';
import type { Profile } from '../../entities/profile/profile';
import { YstuDatabase } from './YstuDatabase';

const legacyDatabaseName = 'yagtu-interview-prep';
const newDatabaseName = 'ystu-interview-prep';

afterEach(async () => {
  await Dexie.delete(legacyDatabaseName);
  await Dexie.delete(newDatabaseName);
});

it('imports legacy profiles when the new database opens', async () => {
  const legacy = new Dexie(legacyDatabaseName);
  legacy.version(1).stores({
    profiles: 'id, updatedAt',
    topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt',
    quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
    oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt',
    partnerAssessments: 'id, [responderProfileId+topicId], responderProfileId, reviewerProfileId, topicId, completedAt',
    studySessions: 'id, startedAt, completedAt',
    settings: 'id',
  });
  const legacyProfiles = legacy.table<Profile, string>('profiles');
  const database = new YstuDatabase(newDatabaseName);
  try {
    await legacy.open();
    await legacyProfiles.bulkPut([
      { id: 'anna', name: 'Анна', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
      { id: 'boris', name: 'Борис', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    ]);
    await database.open();

    expect(await database.profiles.orderBy('id').toArray()).toEqual([
      { id: 'anna', name: 'Анна', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
      { id: 'boris', name: 'Борис', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
    ]);
  } finally {
    legacy.close();
    database.close();
  }
});
