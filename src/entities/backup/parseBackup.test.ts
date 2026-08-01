import { describe, expect, it } from 'vitest';
import type { BackupSnapshot } from './backup';
import { verifyChecksum, withChecksum } from './checksum';
import { parseBackup } from './parseBackup';

const valid: BackupSnapshot = {
  formatVersion: 1,
  exportedAt: '2026-08-01T00:00:00.000Z',
  contentVersion: '2026.08.01-1',
  checksum: 'a'.repeat(64),
  profiles: [
    {
      id: 'p1',
      name: 'Анна',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'p2',
      name: 'Борис',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  topicProgress: [],
  quizAttempts: [],
  oralAttempts: [],
  partnerAssessments: [],
  studySessions: [],
  settings: {
    id: 'app-settings',
    activeProfileId: 'p1',
    theme: 'system',
    oralPreparationSeconds: 20,
    oralAnswerSeconds: 90,
    oralTimerEnabled: true,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
};

describe('parseBackup', () => {
  it('accepts a complete version 1 backup', () => {
    expect(parseBackup(JSON.stringify(valid)).profiles).toHaveLength(2);
  });

  it('accepts a single-profile version 2 cloud backup', () => {
    const cloudBackup: BackupSnapshot = {
      ...valid,
      formatVersion: 2,
      profiles: valid.profiles.slice(0, 1),
    };
    expect(parseBackup(JSON.stringify(cloudBackup)).profiles).toHaveLength(1);
  });

  it('preserves a valid checksum after structural parsing', async () => {
    const exported = await withChecksum({
      ...valid,
      settings: {
        id: 'app-settings',
        theme: 'system',
        oralPreparationSeconds: 20,
        oralAnswerSeconds: 90,
        oralTimerEnabled: true,
        updatedAt: '2026-08-01T00:00:00.000Z',
        activeProfileId: 'p1',
      },
    });

    expect(await verifyChecksum(parseBackup(JSON.stringify(exported)))).toBe(true);
  });

  it('rejects a backup with a malformed entity', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, profiles: [{ id: 1 }] }))).toThrow(
      /структур/i,
    );
  });

  it('rejects a backup that does not contain exactly two profiles', () => {
    expect(() =>
      parseBackup(JSON.stringify({ ...valid, profiles: valid.profiles.slice(0, 1) })),
    ).toThrow(/структур/i);
  });

  it('rejects invalid timestamps', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...valid,
          exportedAt: 'not-a-date',
        }),
      ),
    ).toThrow(/структур/i);
  });

  it('rejects records that reference a profile outside the pair', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...valid,
          topicProgress: [
            {
              id: 'progress-1',
              profileId: 'unknown',
              topicId: 'topic-1-1',
              viewedSections: [],
              manualReview: false,
              status: 'studying',
              masteryScore: 0,
              updatedAt: '2026-08-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    ).toThrow(/структур/i);
  });

  it('rejects duplicate entity identifiers', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...valid,
          quizAttempts: [
            {
              id: 'quiz-1',
              profileId: 'p1',
              topicId: 'topic-1-1',
              correct: 1,
              total: 1,
              score: 1,
              answers: {},
              completedAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
            },
            {
              id: 'quiz-1',
              profileId: 'p2',
              topicId: 'topic-1-1',
              correct: 0,
              total: 1,
              score: 0,
              answers: {},
              completedAt: '2026-08-01T00:01:00.000Z',
              updatedAt: '2026-08-01T00:01:00.000Z',
            },
          ],
        }),
      ),
    ).toThrow(/структур/i);
  });
});
