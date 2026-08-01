import type { SyncOperation } from '../../repositories/CloudStudyRepository';
import type { YstuDatabase } from './YstuDatabase';

export interface SyncOutboxStore {
  list(): Promise<SyncOperation[]>;
  put(operation: SyncOperation): Promise<void>;
  remove(id: string): Promise<void>;
}

export class SyncOutbox implements SyncOutboxStore {
  constructor(private readonly db: YstuDatabase) {}

  async list() {
    return this.db.syncOutbox.orderBy('createdAt').toArray();
  }

  async put(operation: SyncOperation) {
    await this.db.syncOutbox.put(operation);
  }

  async remove(id: string) {
    await this.db.syncOutbox.delete(id);
  }
}
