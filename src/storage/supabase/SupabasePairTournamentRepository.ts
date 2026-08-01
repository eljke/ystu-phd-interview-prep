import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PairInfo,
  PairTournamentRepository,
  TournamentQuestionInput,
  TournamentState,
} from '../../repositories/PairTournamentRepository';
import type { QuizAnswer } from '../../features/quizzes/scoreQuiz';

export class SupabasePairTournamentRepository implements PairTournamentRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async rpc<T>(name: string, parameters?: Record<string, unknown>): Promise<T> {
    const result = await this.client.rpc(name, parameters);
    if (result.error) throw result.error;
    return result.data as T;
  }

  getPair() {
    return this.rpc<PairInfo | null>('get_current_pair');
  }
  createInvite() {
    return this.rpc<{ token: string; expiresAt: string }>('create_pair_invite');
  }
  async acceptInvite(token: string) {
    await this.rpc<string>('accept_pair_invite', { raw_token: token });
  }
  getActiveTournament() {
    return this.rpc<TournamentState | null>('get_active_tournament');
  }
  createTournament(questions: TournamentQuestionInput[]) {
    return this.rpc<TournamentState>('create_tournament', { questions });
  }
  submitAnswer(tournamentId: string, roundIndex: number, answer: QuizAnswer) {
    return this.rpc<TournamentState>('submit_tournament_answer', {
      tournament_id: tournamentId,
      round_index: roundIndex,
      answer,
    });
  }
  advance(tournamentId: string) {
    return this.rpc<TournamentState>('advance_tournament', { requested_id: tournamentId });
  }
}
