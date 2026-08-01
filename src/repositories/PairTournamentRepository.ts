import type { QuizAnswer } from '../features/quizzes/scoreQuiz';

export interface PairInfo {
  id: string;
  members: Array<{ userId: string; displayName: string }>;
}

export interface TournamentQuestionInput {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'matching' | 'ordering' | 'fill-blank';
  correctAnswer: unknown;
  explanation: string;
}

export interface TournamentState {
  id: string;
  status: 'active' | 'completed';
  currentRound: number;
  totalRounds: number;
  questionId: string | null;
  submitted: boolean;
  revealed: boolean;
  myAnswer: QuizAnswer | null;
  opponentAnswer: QuizAnswer | null;
  correctAnswer: unknown;
  explanation: string | null;
  myRoundScore: number | null;
  opponentRoundScore: number | null;
  myScore: number;
  opponentScore: number;
}

export interface PairTournamentRepository {
  getPair(): Promise<PairInfo | null>;
  createInvite(): Promise<{ token: string; expiresAt: string }>;
  acceptInvite(token: string): Promise<void>;
  getActiveTournament(): Promise<TournamentState | null>;
  createTournament(questions: TournamentQuestionInput[]): Promise<TournamentState>;
  submitAnswer(
    tournamentId: string,
    roundIndex: number,
    answer: QuizAnswer,
  ): Promise<TournamentState>;
  advance(tournamentId: string): Promise<TournamentState>;
}
