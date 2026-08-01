import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { MatchingQuestion, MultipleChoiceQuestion } from '../../entities/content/topic';
import type { QuizAttempt } from '../../entities/progress/progress';
import { PracticeHistory, formatCorrectAnswer, formatGivenAnswer } from './PracticeHistory';

describe('practice history answers', () => {
  it('shows selected and correct multiple-choice statements', () => {
    const question: MultipleChoiceQuestion = {
      id: 'q1',
      type: 'multiple-choice',
      prompt: 'Отметьте верные утверждения.',
      explanation: 'Пояснение',
      keyPointIds: [],
      options: [
        { id: 'a', text: 'Первое' },
        { id: 'b', text: 'Второе' },
        { id: 'c', text: 'Третье' },
      ],
      correctOptionIds: ['a', 'c'],
    };
    expect(formatGivenAnswer(question, ['a', 'b'])).toBe('Первое; Второе');
    expect(formatCorrectAnswer(question)).toBe('Первое; Третье');
  });

  it('shows both sides of a saved matching answer', () => {
    const question: MatchingQuestion = {
      id: 'q2',
      type: 'matching',
      prompt: 'Сопоставьте',
      explanation: 'Пояснение',
      keyPointIds: [],
      left: [{ id: 'css', text: 'CSS' }],
      right: [{ id: 'style', text: 'Оформление' }],
      pairs: { css: 'style' },
    };
    expect(formatGivenAnswer(question, { css: 'style' })).toBe('CSS — Оформление');
    expect(formatCorrectAnswer(question)).toBe('CSS — Оформление');
  });

  it('opens a saved mistake with the given and correct answers', () => {
    const question: MultipleChoiceQuestion = {
      id: 'q1',
      type: 'multiple-choice',
      prompt: 'Отметьте верные утверждения.',
      explanation: 'JavaScript реагирует на события.',
      keyPointIds: [],
      options: [
        { id: 'a', text: 'Реагирует на события' },
        { id: 'b', text: 'Задаёт только цвет' },
      ],
      correctOptionIds: ['a'],
    };
    const attempt: QuizAttempt = {
      id: 'attempt-1',
      profileId: 'user-1',
      topicId: 'topic-3-14',
      correct: 0,
      total: 1,
      score: 0,
      answers: { 'topic-3-14:q1': ['b'] },
      questionResults: [
        { questionId: 'topic-3-14:q1', topicId: 'topic-3-14', correct: false, score: 0 },
      ],
      completedAt: '2026-08-01T12:00:00.000Z',
      updatedAt: '2026-08-01T12:00:00.000Z',
    };
    render(
      createElement(PracticeHistory, {
        attempts: [attempt],
        bank: [
          {
            id: 'topic-3-14:q1',
            topicId: 'topic-3-14',
            topicCode: '3.14',
            topicTitle: 'Таблицы стилей. Сценарии JavaScript. Фреймворки.',
            section: 'software-complexes',
            kind: 'objective',
            question,
            sourceTitles: ['PDF'],
          },
        ],
      }),
    );

    fireEvent.click(screen.getByText(/01\.08\.2026/));
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Ваш ответ').parentElement).toHaveTextContent('Задаёт только цвет');
    expect(screen.getByText('Правильный ответ').parentElement).toHaveTextContent(
      'Реагирует на события',
    );
  });
});
