import type { BackupSnapshot } from './backup';

type UpdatedEntity = { id: string; updatedAt: string };

function mergeByUpdated<T extends UpdatedEntity>(local: T[], incoming: T[]): T[] {
  const map = new Map(local.map((item) => [item.id, item]));
  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) map.set(item.id, item);
  }
  return [...map.values()];
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('ru');
}

function alignIncomingProfiles(
  local: BackupSnapshot,
  incoming: BackupSnapshot,
): BackupSnapshot {
  const localById = new Map(local.profiles.map((profile) => [profile.id, profile]));
  const localByName = new Map(
    local.profiles.map((profile) => [normalizeName(profile.name), profile]),
  );
  const profileIdMap = new Map<string, string>();
  const usedLocalIds = new Set<string>();

  for (const profile of incoming.profiles) {
    const exact = localById.get(profile.id);
    const byName = localByName.get(normalizeName(profile.name));
    const match = exact ?? byName;
    if (!match || usedLocalIds.has(match.id)) {
      throw new Error(
        'Нельзя безопасно объединить данные: резервные копии относятся к разным участникам. Используйте полную замену только после проверки имён.',
      );
    }
    profileIdMap.set(profile.id, match.id);
    usedLocalIds.add(match.id);
  }

  if (usedLocalIds.size !== local.profiles.length) {
    throw new Error(
      'Нельзя безопасно объединить данные: состав участников в резервных копиях различается.',
    );
  }

  const mapProfileId = (profileId: string): string => {
    const mapped = profileIdMap.get(profileId);
    if (!mapped) throw new Error('В резервной копии обнаружена неизвестная ссылка на участника.');
    return mapped;
  };

  return {
    ...incoming,
    checksum: 'pending',
    profiles: incoming.profiles.map((profile) => ({
      ...profile,
      id: mapProfileId(profile.id),
    })),
    topicProgress: incoming.topicProgress.map((progress) => {
      const profileId = mapProfileId(progress.profileId);
      return {
        ...progress,
        id: `${profileId}:${progress.topicId}`,
        profileId,
      };
    }),
    quizAttempts: incoming.quizAttempts.map((attempt) => ({
      ...attempt,
      profileId: mapProfileId(attempt.profileId),
    })),
    oralAttempts: incoming.oralAttempts.map((attempt) => ({
      ...attempt,
      profileId: mapProfileId(attempt.profileId),
    })),
    partnerAssessments: incoming.partnerAssessments.map((assessment) => ({
      ...assessment,
      responderProfileId: mapProfileId(assessment.responderProfileId),
      reviewerProfileId: mapProfileId(assessment.reviewerProfileId),
    })),
    studySessions: incoming.studySessions.map((session) => ({
      ...session,
      participantIds: [
        mapProfileId(session.participantIds[0]),
        mapProfileId(session.participantIds[1]),
      ],
    })),
    settings: {
      ...incoming.settings,
      ...(incoming.settings.activeProfileId
        ? { activeProfileId: mapProfileId(incoming.settings.activeProfileId) }
        : {}),
    },
  };
}

export interface MergePreview {
  merged: BackupSnapshot;
  newerFromImport: number;
  keptLocal: number;
}

export function mergeBackup(local: BackupSnapshot, incoming: BackupSnapshot): MergePreview {
  const alignedIncoming = alignIncomingProfiles(local, incoming);
  let newerFromImport = 0;
  let keptLocal = 0;

  const merge = <T extends UpdatedEntity>(localItems: T[], incomingItems: T[]) => {
    for (const item of incomingItems) {
      const existing = localItems.find((candidate) => candidate.id === item.id);
      if (!existing || item.updatedAt > existing.updatedAt) newerFromImport += 1;
      else keptLocal += 1;
    }
    return mergeByUpdated(localItems, incomingItems);
  };

  const profiles = merge(local.profiles, alignedIncoming.profiles);
  const topicProgress = merge(local.topicProgress, alignedIncoming.topicProgress);
  const quizAttempts = merge(local.quizAttempts, alignedIncoming.quizAttempts);
  const oralAttempts = merge(local.oralAttempts, alignedIncoming.oralAttempts);
  const partnerAssessments = merge(
    local.partnerAssessments,
    alignedIncoming.partnerAssessments,
  );
  const studySessions = merge(local.studySessions, alignedIncoming.studySessions);
  const settings =
    alignedIncoming.settings.updatedAt > local.settings.updatedAt
      ? alignedIncoming.settings
      : local.settings;

  return {
    newerFromImport,
    keptLocal,
    merged: {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      contentVersion: local.contentVersion,
      checksum: 'pending',
      profiles,
      topicProgress,
      quizAttempts,
      oralAttempts,
      partnerAssessments,
      studySessions,
      settings,
    },
  };
}
