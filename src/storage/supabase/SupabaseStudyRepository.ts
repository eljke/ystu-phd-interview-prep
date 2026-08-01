import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CloudSnapshot,
  CloudStudyRepository,
  SyncOperation,
} from '../../repositories/CloudStudyRepository';
import type { OralAttempt, QuizAttempt, TopicProgress } from '../../entities/progress/progress';

export class SupabaseStudyRepository implements CloudStudyRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async pull(profileId: string): Promise<CloudSnapshot> {
    const [progress, quizzes, oral] = await Promise.all([
      this.client.from('topic_progress').select('payload').eq('user_id', this.userId),
      this.client.from('quiz_attempts').select('payload').eq('user_id', this.userId),
      this.client.from('oral_attempts').select('payload').eq('user_id', this.userId),
    ]);
    const error = progress.error ?? quizzes.error ?? oral.error;
    if (error) throw error;
    const withProfile = <T extends { profileId: string }>(rows: Array<{ payload: unknown }>) =>
      rows.map((row) => ({ ...(row.payload as T), profileId }));
    return {
      topicProgress: withProfile<TopicProgress>(progress.data ?? []),
      quizAttempts: withProfile<QuizAttempt>(quizzes.data ?? []),
      oralAttempts: withProfile<OralAttempt>(oral.data ?? []),
    };
  }

  async apply(operation: SyncOperation): Promise<void> {
    const payload = { ...operation.payload, profileId: this.userId };
    const table =
      operation.entity === 'topic-progress'
        ? this.client.from('topic_progress').upsert(
            {
              user_id: this.userId,
              topic_id: operation.payload.topicId,
              payload,
              updated_at: operation.payload.updatedAt,
            },
            { onConflict: 'user_id,topic_id' },
          )
        : operation.entity === 'quiz-attempt'
          ? this.client.from('quiz_attempts').upsert({
              id: operation.entityId,
              user_id: this.userId,
              topic_id: operation.payload.topicId,
              payload,
              completed_at: (operation.payload as QuizAttempt).completedAt,
            })
          : this.client.from('oral_attempts').upsert({
              id: operation.entityId,
              user_id: this.userId,
              topic_id: operation.payload.topicId,
              mode: 'solo',
              payload,
              completed_at: (operation.payload as OralAttempt).completedAt,
            });
    const { error } = await table;
    if (error) throw error;
  }
}
