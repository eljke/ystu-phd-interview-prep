import { describe, expect, it } from 'vitest';
import type {
  CloudSnapshot,
  CloudStudyRepository,
  SyncOperation,
} from '../../repositories/CloudStudyRepository';
import type { TopicProgress } from '../../entities/progress/progress';
import { MemoryStudyRepository } from '../memory/MemoryStudyRepository';
import type { SyncOutboxStore } from '../dexie/SyncOutbox';
import { SyncingStudyRepository } from './SyncingStudyRepository';

const empty: CloudSnapshot = { topicProgress: [], quizAttempts: [], oralAttempts: [] };
const progress: TopicProgress = {
  id: 'user-1:topic-1',
  profileId: 'user-1',
  topicId: 'topic-1',
  viewedSections: ['shortAnswer'],
  manualReview: false,
  status: 'studying' as const,
  masteryScore: 0.25,
  updatedAt: '2026-08-01T12:00:00.000Z',
};

class MemoryOutbox implements SyncOutboxStore {
  operations = new Map<string, SyncOperation>();
  async list() {
    return [...this.operations.values()];
  }
  async put(operation: SyncOperation) {
    this.operations.set(operation.id, operation);
  }
  async remove(id: string) {
    this.operations.delete(id);
  }
}

describe('SyncingStudyRepository', () => {
  it('keeps local writes queued while offline and retries idempotently', async () => {
    const local = new MemoryStudyRepository();
    const outbox = new MemoryOutbox();
    let online = false;
    const received = new Map<string, SyncOperation>();
    const cloud: CloudStudyRepository = {
      pull: async () => empty,
      apply: async (operation) => {
        if (!online) throw new Error('offline');
        received.set(operation.id, operation);
      },
    };
    const repository = new SyncingStudyRepository(local, cloud, outbox, 'user-1');
    await repository.initialize();

    await repository.saveTopicProgress(progress);
    expect(await local.getTopicProgress('user-1', 'topic-1')).toEqual(progress);
    expect(await outbox.list()).toHaveLength(1);

    online = true;
    expect(await repository.flushOutbox()).toEqual({ sent: 1, pending: 0 });
    expect(received.get('topic-progress:user-1:topic-1')?.payload).toEqual(progress);
    expect(await repository.flushOutbox()).toEqual({ sent: 0, pending: 0 });
  });

  it('hydrates the local cache from authoritative cloud data', async () => {
    const local = new MemoryStudyRepository();
    const cloud: CloudStudyRepository = {
      pull: async () => ({ ...empty, topicProgress: [progress] }),
      apply: async () => undefined,
    };
    const repository = new SyncingStudyRepository(local, cloud, new MemoryOutbox(), 'user-1');

    await repository.initialize();

    expect(await repository.getTopicProgress('user-1', 'topic-1')).toEqual(progress);
  });
});
