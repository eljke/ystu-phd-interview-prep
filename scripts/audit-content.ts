import { auditTopics } from '../src/entities/content/contentAudit';
import { topicManifest } from '../src/content/topicManifest';
import { topics } from '../src/content/topics/data';

const report = auditTopics(topics, topicManifest);
console.log(`Тем: ${report.totalTopics}`);
console.log(`Разделы: ${JSON.stringify(report.sectionCounts)}`);
if (report.errors.length > 0) {
  for (const error of report.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Контент прошёл проверку: 43 темы, распределение 16 / 10 / 17.');
}
