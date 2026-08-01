import { auditTopics } from '../../entities/content/contentAudit';
import type { Topic } from '../../entities/content/topic';
import { topicManifest } from '../topicManifest';
import { topics as rawTopics } from './data';

const report = auditTopics(rawTopics, topicManifest);
if (report.errors.length > 0) {
  throw new Error(`Ошибка учебного контента:\n${report.errors.join('\n')}`);
}

export const topics: readonly Topic[] = rawTopics;
export const topicById = new Map(topics.map((topic) => [topic.id, topic]));
export const topicByCode = new Map(topics.map((topic) => [topic.code, topic]));
