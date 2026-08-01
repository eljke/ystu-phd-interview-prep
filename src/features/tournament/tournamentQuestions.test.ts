import { describe, expect, it } from 'vitest';
import { topics } from '../../content/topics';
import { buildQuestionBank } from '../quizzes/questionBank';
import { toTournamentQuestion } from './tournamentQuestions';

describe('tournament question serialization', () => {
  it('sends answer keys for objective formats but excludes self-reviewed recall', () => {
    const bank = buildQuestionBank(topics);
    expect(
      bank.filter((item) => item.kind === 'objective').every((item) => toTournamentQuestion(item)),
    ).toBe(true);
    expect(toTournamentQuestion(bank.find((item) => item.kind === 'free-recall')!)).toBeNull();
  });
});
