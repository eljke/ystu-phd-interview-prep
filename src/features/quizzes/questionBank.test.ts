import { describe, expect, it } from 'vitest';
import { topics } from '../../content/topics';
import { buildQuestionBank, selectPracticeQuestions } from './questionBank';

describe('question bank', () => {
  it('covers every programme topic with several source-grounded questions', () => {
    const bank = buildQuestionBank(topics);
    expect(new Set(bank.map((item) => item.topicId)).size).toBe(topics.length);
    expect(bank.length).toBeGreaterThan(200);
    expect(bank.filter((item) => item.question.type === 'fill-blank')).toHaveLength(topics.length);
    expect(bank.filter((item) => item.question.type === 'ordering')).toHaveLength(12);
    expect(bank.every((item) => item.sourceTitles.length > 0)).toBe(true);
    for (const topic of topics) {
      const formats = new Set(
        bank.filter((item) => item.topicId === topic.id).map((item) => item.question.type),
      );
      expect([...formats]).toEqual(
        expect.arrayContaining(['single-choice', 'multiple-choice', 'matching', 'free-recall']),
      );
    }
  });

  it('builds a mixed set without recent questions or duplicate topics', () => {
    const bank = buildQuestionBank(topics);
    const selected = selectPracticeQuestions({
      bank,
      count: 10,
      recentQuestionIds: bank.slice(0, 20).map((item) => item.id),
      random: () => 0.42,
    });
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((item) => item.topicId)).size).toBe(10);
    expect(
      selected.every((item) => !bank.slice(0, 20).some((recent) => recent.id === item.id)),
    ).toBe(true);
  });

  it('keeps a single-topic set short and varied', () => {
    const bank = buildQuestionBank(topics).filter((item) => item.topicCode === '1.2');
    const selected = selectPracticeQuestions({ bank, count: 5, random: () => 0.42 });

    expect(selected).toHaveLength(5);
    expect(new Set(selected.map((item) => item.question.type)).size).toBe(5);
    expect(
      selected.some((item) => item.question.prompt.startsWith('Как проще всего объяснить')),
    ).toBe(false);
  });
});
