import { describe, expect, it } from 'vitest';
import { topics } from '../../content/topics';
import { createOrderingQuestion } from './orderingQuestions';

describe('ordering questions', () => {
  it('adds only sequences with an unambiguous order', () => {
    const questions = topics.map(createOrderingQuestion).filter((item) => item !== null);
    expect(questions).toHaveLength(10);
    expect(questions.every((item) => item.items.length === item.correctOrder.length)).toBe(true);
    expect(questions.every((item) => item.items.length >= 4)).toBe(true);
  });
});
