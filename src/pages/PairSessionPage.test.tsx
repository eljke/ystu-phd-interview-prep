import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../app/providers/AuthProvider';
import { topics } from '../content/topics';
import { buildQuestionBank } from '../features/quizzes/questionBank';
import type {
  PairTournamentRepository,
  TournamentState,
} from '../repositories/PairTournamentRepository';
import type { AuthGateway } from '../services/auth/AuthGateway';
import { PairSessionPage } from './PairSessionPage';

const item = buildQuestionBank(topics).find(
  (candidate) => candidate.question.type === 'single-choice',
)!;
const singleQuestion = item.question;
if (singleQuestion.type !== 'single-choice') throw new Error('Single-choice fixture is missing');

const waiting: TournamentState = {
  id: 'tournament-1',
  status: 'active',
  currentRound: 0,
  totalRounds: 3,
  questionId: item.id,
  submitted: false,
  revealed: false,
  myAnswer: null,
  opponentAnswer: null,
  correctAnswer: null,
  explanation: null,
  myRoundScore: null,
  opponentRoundScore: null,
  myScore: 0,
  opponentScore: 0,
};

describe('PairSessionPage', () => {
  it('keeps the first answer sealed until both users submit', async () => {
    let current = waiting;
    const repository: PairTournamentRepository = {
      getPair: vi.fn().mockResolvedValue({
        id: 'pair-1',
        members: [
          { userId: 'user-1', displayName: 'Первый' },
          { userId: 'user-2', displayName: 'Второй' },
        ],
      }),
      createInvite: vi.fn(),
      acceptInvite: vi.fn(),
      createTournament: vi.fn(),
      advance: vi.fn(),
      getActiveTournament: vi.fn().mockImplementation(async () => current),
      submitAnswer: vi.fn().mockImplementation(async (_id, _round, answer) => {
        current = { ...waiting, submitted: true, myAnswer: answer };
        return current;
      }),
    };
    const auth: AuthGateway = {
      getSession: vi.fn().mockResolvedValue({ userId: 'user-1', githubLogin: 'first' }),
      checkAccess: vi.fn().mockResolvedValue({ status: 'allowed', role: 'member' }),
      signInWithGitHub: vi.fn(),
      signOut: vi.fn(),
    };
    render(
      <AuthProvider gateway={auth}>
        <MemoryRouter>
          <PairSessionPage gateway={repository} />
        </MemoryRouter>
      </AuthProvider>,
    );

    await userEvent.click(await screen.findByText(singleQuestion.options[0]!.text));
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать ответ' }));
    expect(await screen.findByText('Ответ зафиксирован')).toBeInTheDocument();
    expect(screen.queryByText(/Ответ партнёра ·/)).not.toBeInTheDocument();

    current = {
      ...current,
      revealed: true,
      opponentAnswer: singleQuestion.correctOptionId,
      correctAnswer: singleQuestion.correctOptionId,
      explanation: singleQuestion.explanation,
      myRoundScore: 0,
      opponentRoundScore: 1,
    };
    await userEvent.click(screen.getByRole('button', { name: 'Обновить' }));
    expect(await screen.findByText(/Ответ партнёра · 1 балл/)).toBeInTheDocument();
    expect(screen.getAllByText(singleQuestion.explanation).length).toBeGreaterThan(0);
  });
});
