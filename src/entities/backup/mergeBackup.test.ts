import { describe, expect, it } from 'vitest';
import type { BackupSnapshot } from './backup';
import { mergeBackup } from './mergeBackup';

const snapshot = (): BackupSnapshot => ({
  formatVersion: 1,
  exportedAt: '2026-08-01T00:00:00.000Z',
  contentVersion: '2026.08.01-1',
  checksum: 'pending',
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
});

describe('mergeBackup', () => {
  it('reports records that were taken from the imported backup', () => {
    const local = snapshot();
    const incoming = snapshot();
    incoming.profiles[0] = {
      ...incoming.profiles[0]!,
      name: 'Анна после занятия',
      updatedAt: '2026-08-02T00:00:00.000Z',
    };

    const result = mergeBackup(local, incoming);

    expect(result.newerFromImport).toBe(1);
    expect(result.keptLocal).toBe(1);
    expect(result.merged.profiles[0]?.name).toBe('Анна после занятия');
  });
});

it('aligns imported participants by name when profile ids differ', () => {
  const local = snapshot();
  local.topicProgress = [
    {
      id: 'p1:topic-1-1',
      profileId: 'p1',
      topicId: 'topic-1-1',
      viewedSections: ['shortAnswer'],
      manualReview: false,
      status: 'studying',
      masteryScore: 0.2,
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];
  const incoming = snapshot();
  incoming.profiles = incoming.profiles.map((profile, index) => ({
    ...profile,
    id: index === 0 ? 'remote-a' : 'remote-b',
  }));
  incoming.settings = { ...incoming.settings, activeProfileId: 'remote-a' };
  incoming.topicProgress = [
    {
      id: 'remote-a:topic-1-1',
      profileId: 'remote-a',
      topicId: 'topic-1-1',
      viewedSections: ['shortAnswer', 'extendedAnswer'],
      manualReview: false,
      status: 'studying',
      masteryScore: 0.4,
      updatedAt: '2026-08-02T00:00:00.000Z',
    },
  ];

  const result = mergeBackup(local, incoming);

  expect(result.merged.profiles).toHaveLength(2);
  expect(result.merged.topicProgress).toHaveLength(1);
  expect(result.merged.topicProgress[0]).toMatchObject({
    id: 'p1:topic-1-1',
    profileId: 'p1',
    masteryScore: 0.4,
  });
  expect(result.merged.settings.activeProfileId).toBe('p1');
});

it('rejects merging backups that describe different participants', () => {
  const local = snapshot();
  const incoming = snapshot();
  incoming.profiles = [
    { ...incoming.profiles[0]!, id: 'remote-a', name: 'Вера' },
    { ...incoming.profiles[1]!, id: 'remote-b', name: 'Глеб' },
  ];

  expect(() => mergeBackup(local, incoming)).toThrow('разным участникам');
});
