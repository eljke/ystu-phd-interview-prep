import type { Topic, TopicSection } from './topic';

export interface TopicManifestEntry {
  code: string;
  section: TopicSection;
  originalText: string;
}
import { topicSchema } from './topicSchema';

export interface ContentAuditReport {
  totalTopics: number;
  sectionCounts: Record<TopicSection, number>;
  errors: string[];
}

const expectedCodes = [
  ...Array.from({ length: 16 }, (_, index) => `1.${index + 1}`),
  ...Array.from({ length: 10 }, (_, index) => `2.${index + 1}`),
  ...Array.from({ length: 17 }, (_, index) => `3.${index + 1}`),
];

export function auditTopics(
  topics: readonly Topic[],
  manifest: readonly TopicManifestEntry[] = [],
): ContentAuditReport {
  const errors: string[] = [];
  const sectionCounts: Record<TopicSection, number> = {
    'mathematical-modeling': 0,
    'numerical-methods': 0,
    'software-complexes': 0,
  };
  const codes = new Set<string>();
  const ids = new Set<string>();

  for (const topic of topics) {
    const parsed = topicSchema.safeParse(topic);
    if (!parsed.success) {
      errors.push(`${topic.code}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`);
    }
    if (codes.has(topic.code)) errors.push(`Повтор кода ${topic.code}`);
    if (ids.has(topic.id)) errors.push(`Повтор id ${topic.id}`);
    codes.add(topic.code);
    ids.add(topic.id);
    sectionCounts[topic.section] += 1;
  }

  if (manifest.length > 0) {
    const manifestByCode = new Map(manifest.map((entry) => [entry.code, entry]));
    for (const topic of topics) {
      const entry = manifestByCode.get(topic.code);
      if (!entry) continue;
      if (topic.section !== entry.section) errors.push(`${topic.code}: изменён раздел исходной программы`);
      if (topic.originalText !== entry.originalText) errors.push(`${topic.code}: изменена исходная формулировка`);
    }
  }

  for (const code of expectedCodes) if (!codes.has(code)) errors.push(`Отсутствует тема ${code}`);
  for (const code of codes) if (!expectedCodes.includes(code)) errors.push(`Лишняя тема ${code}`);

  if (sectionCounts['mathematical-modeling'] !== 16) errors.push('Раздел 1 должен содержать 16 тем');
  if (sectionCounts['numerical-methods'] !== 10) errors.push('Раздел 2 должен содержать 10 тем');
  if (sectionCounts['software-complexes'] !== 17) errors.push('Раздел 3 должен содержать 17 тем');

  return { totalTopics: topics.length, sectionCounts, errors };
}
