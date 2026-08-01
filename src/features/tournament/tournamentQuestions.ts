import type { TournamentQuestionInput } from '../../repositories/PairTournamentRepository';
import type { QuestionBankItem } from '../quizzes/questionBank';

export function toTournamentQuestion(item: QuestionBankItem): TournamentQuestionInput | null {
  const question = item.question;
  if (question.type === 'free-recall') return null;
  const correctAnswer =
    question.type === 'single-choice'
      ? question.correctOptionId
      : question.type === 'multiple-choice'
        ? [...question.correctOptionIds].sort()
        : question.type === 'matching'
          ? question.pairs
          : question.type === 'ordering'
            ? question.correctOrder
            : question.acceptedAnswers;
  return { id: item.id, type: question.type, correctAnswer, explanation: question.explanation };
}
