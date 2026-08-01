import { describe, expect, it } from 'vitest';
import { topicManifest } from '../../content/topicManifest';
import { topics } from '../../content/topics/data';
import { auditTopics } from './contentAudit';

describe('auditTopics', () => {
  it('accepts the complete official programme', () => {
    const report = auditTopics(topics, topicManifest);
    expect(report.totalTopics).toBe(43);
    expect(report.sectionCounts).toEqual({
      'mathematical-modeling': 16,
      'numerical-methods': 10,
      'software-complexes': 17,
    });
    expect(report.errors).toEqual([]);
  });


  it('reports altered official wording', () => {
    const changed = topics.map((topic) =>
      topic.code === '1.1' ? { ...topic, originalText: 'Изменённая формулировка' } : topic,
    );
    expect(auditTopics(changed, topicManifest).errors).toContain('1.1: изменена исходная формулировка');
  });

  it('reports a missing topic', () => {
    const report = auditTopics(topics.filter((topic) => topic.code !== '2.10'), topicManifest);
    expect(report.errors).toContain('Отсутствует тема 2.10');
  });
});
