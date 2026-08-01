import type { QuizQuestion } from '../../entities/content/topic';

export type QuizAnswer = string | string[] | Record<string, string>;
const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('ru')
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
export function isAnswerCorrect(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  if (answer === undefined) return false;
  switch (question.type) {
    case 'single-choice':
      return typeof answer === 'string' && answer === question.correctOptionId;
    case 'multiple-choice':
      return (
        Array.isArray(answer) &&
        [...answer].sort().join('|') === [...question.correctOptionIds].sort().join('|')
      );
    case 'matching':
      return (
        !Array.isArray(answer) &&
        typeof answer === 'object' &&
        Object.entries(question.pairs).every(([left, right]) => answer[left] === right)
      );
    case 'ordering':
      return Array.isArray(answer) && answer.join('|') === question.correctOrder.join('|');
    case 'fill-blank':
      return (
        typeof answer === 'string' &&
        question.acceptedAnswers.some((item) =>
          question.caseSensitive
            ? item.trim() === answer.trim()
            : normalize(item) === normalize(answer),
        )
      );
  }
}

export function isQuestionAnswered(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  if (answer === undefined) return false;
  if (question.type === 'fill-blank') return typeof answer === 'string' && answer.trim().length > 0;
  if (question.type === 'multiple-choice') return Array.isArray(answer) && answer.length > 0;
  if (question.type === 'ordering') return Array.isArray(answer) && answer.length === question.items.length;
  if (question.type === 'matching')
    return (
      !Array.isArray(answer) &&
      typeof answer === 'object' &&
      question.left.every((item) => Boolean(answer[item.id]))
    );
  return typeof answer === 'string' && answer.length > 0;
}
