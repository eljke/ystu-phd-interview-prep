import { z } from 'zod';
import type { BackupSnapshot } from './backup';

const nonEmpty = z.string().trim().min(1);
const timestamp = nonEmpty.refine(
  (value) => /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)),
  'Invalid timestamp',
);
const criterion = z.object({
  criterionId: nonEmpty,
  result: z.enum(['covered', 'partial', 'missed']),
});

const profile = z.object({
  id: nonEmpty,
  name: nonEmpty,
  createdAt: timestamp,
  updatedAt: timestamp,
});
const topicProgress = z.object({
  id: nonEmpty,
  profileId: nonEmpty,
  topicId: nonEmpty,
  viewedSections: z.array(
    z.enum(['shortAnswer', 'extendedAnswer', 'keyPoints', 'formulas', 'example', 'commonMistakes']),
  ),
  manualReview: z.boolean(),
  status: z.enum(['not-started', 'studying', 'can-answer', 'mastered', 'needs-review']),
  masteryScore: z.number().finite().min(0).max(1),
  updatedAt: timestamp,
});
const quizAttempt = z
  .object({
    id: nonEmpty,
    profileId: nonEmpty,
    topicId: nonEmpty,
    correct: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    score: z.number().finite().min(0).max(1),
    answers: z.record(z.string(), z.unknown()),
    completedAt: timestamp,
    updatedAt: timestamp,
  })
  .refine((attempt) => attempt.correct <= attempt.total, {
    message: 'Correct answers cannot exceed total answers',
  });
const oralAttempt = z.object({
  id: nonEmpty,
  profileId: nonEmpty,
  topicId: nonEmpty,
  selfConfidence: z.number().finite().min(0).max(1),
  oralScore: z.number().finite().min(0).max(1),
  criteria: z.array(criterion),
  startedAt: timestamp,
  completedAt: timestamp,
  updatedAt: timestamp,
});
const partnerAssessment = z.object({
  id: nonEmpty,
  oralAttemptId: nonEmpty,
  responderProfileId: nonEmpty,
  reviewerProfileId: nonEmpty,
  topicId: nonEmpty,
  score: z.number().finite().min(0).max(1),
  criteria: z.array(criterion),
  notes: nonEmpty.optional(),
  completedAt: timestamp,
  updatedAt: timestamp,
});
const studySession = z.object({
  id: nonEmpty,
  mode: z.enum(['selected', 'random-section', 'responder-weak', 'pair-weak', 'mock-interview']),
  participantIds: z.tuple([nonEmpty, nonEmpty]),
  topicIds: z.array(nonEmpty),
  attemptIds: z.array(nonEmpty),
  startedAt: timestamp,
  completedAt: timestamp.optional(),
  updatedAt: timestamp,
});
const settings = z.object({
  id: z.literal('app-settings'),
  activeProfileId: nonEmpty.optional(),
  theme: z.enum(['light', 'dark', 'system']),
  oralPreparationSeconds: z.number().int().min(0).max(600),
  oralAnswerSeconds: z.number().int().min(0).max(1800),
  oralTimerEnabled: z.boolean(),
  updatedAt: timestamp,
});

const backupSchema = z
  .object({
    formatVersion: z.union([z.literal(1), z.literal(2)]),
    exportedAt: timestamp,
    contentVersion: nonEmpty,
    checksum: z.string().regex(/^[a-f0-9]{64}$/i),
    profiles: z.array(profile).min(1).max(2),
    topicProgress: z.array(topicProgress),
    quizAttempts: z.array(quizAttempt),
    oralAttempts: z.array(oralAttempt),
    partnerAssessments: z.array(partnerAssessment),
    studySessions: z.array(studySession),
    settings,
  })
  .superRefine((snapshot, context) => {
    const addIssue = (path: Array<string | number>, message: string) => {
      context.addIssue({ code: 'custom', message, path });
    };
    const profileIds = new Set(snapshot.profiles.map((item) => item.id));

    if (snapshot.formatVersion === 1 && snapshot.profiles.length !== 2) {
      addIssue(['profiles'], 'Version 1 backups must contain two profiles');
    }
    if (profileIds.size !== snapshot.profiles.length) {
      addIssue(['profiles'], 'Profile identifiers must be unique');
    }
    if (snapshot.settings.activeProfileId && !profileIds.has(snapshot.settings.activeProfileId)) {
      addIssue(['settings', 'activeProfileId'], 'Active profile is missing');
    }

    const validateUniqueIds = (items: Array<{ id: string }>, path: string) => {
      if (new Set(items.map((item) => item.id)).size !== items.length) {
        addIssue([path], `${path} identifiers must be unique`);
      }
    };
    validateUniqueIds(snapshot.profiles, 'profiles');
    validateUniqueIds(snapshot.topicProgress, 'topicProgress');
    validateUniqueIds(snapshot.quizAttempts, 'quizAttempts');
    validateUniqueIds(snapshot.oralAttempts, 'oralAttempts');
    validateUniqueIds(snapshot.partnerAssessments, 'partnerAssessments');
    validateUniqueIds(snapshot.studySessions, 'studySessions');

    const validateProfileReference = (profileId: string, path: Array<string | number>) => {
      if (!profileIds.has(profileId)) addIssue(path, 'Referenced profile is missing');
    };

    snapshot.topicProgress.forEach((item, index) =>
      validateProfileReference(item.profileId, ['topicProgress', index, 'profileId']),
    );
    snapshot.quizAttempts.forEach((item, index) =>
      validateProfileReference(item.profileId, ['quizAttempts', index, 'profileId']),
    );
    snapshot.oralAttempts.forEach((item, index) =>
      validateProfileReference(item.profileId, ['oralAttempts', index, 'profileId']),
    );
    snapshot.partnerAssessments.forEach((item, index) => {
      validateProfileReference(item.responderProfileId, [
        'partnerAssessments',
        index,
        'responderProfileId',
      ]);
      validateProfileReference(item.reviewerProfileId, [
        'partnerAssessments',
        index,
        'reviewerProfileId',
      ]);
      if (item.responderProfileId === item.reviewerProfileId) {
        addIssue(
          ['partnerAssessments', index],
          'Responder and reviewer must be different profiles',
        );
      }
    });
    snapshot.studySessions.forEach((item, index) => {
      validateProfileReference(item.participantIds[0], [
        'studySessions',
        index,
        'participantIds',
        0,
      ]);
      validateProfileReference(item.participantIds[1], [
        'studySessions',
        index,
        'participantIds',
        1,
      ]);
      if (item.participantIds[0] === item.participantIds[1]) {
        addIssue(['studySessions', index, 'participantIds'], 'Session participants must differ');
      }
    });
  });

export function parseBackup(value: string): BackupSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Файл не является корректным JSON.');
  }
  const result = backupSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const location = first?.path.join('.') || 'root';
    throw new Error(`Резервная копия не прошла структурную проверку (${location}).`);
  }
  return result.data as BackupSnapshot;
}
