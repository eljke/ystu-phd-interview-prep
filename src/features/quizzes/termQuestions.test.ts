import { describe, expect, it } from 'vitest';
import { topics } from '../../content/topics';
import { createTermQuestion } from './termQuestions';

describe('term questions', () => {
  it('uses only short answers and includes common case forms', () => {
    const questions = topics.map(createTermQuestion).filter((item) => item !== null);
    expect(questions).toHaveLength(41);
    expect(
      questions
        .flatMap((item) => item.acceptedAnswers)
        .every((answer) => answer.split(/\s+/).length <= 4),
    ).toBe(true);
    expect(questions.find((item) => item.id === 'topic-1-1:term')?.acceptedAnswers).toContain(
      'модели',
    );
  });
});
