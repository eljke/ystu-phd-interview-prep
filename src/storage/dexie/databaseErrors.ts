export type StorageErrorKind = 'unavailable' | 'quota' | 'unknown';
export class StorageError extends Error {
  constructor(public readonly kind: StorageErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageError';
  }
}
export function mapStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  if (name === 'QuotaExceededError') return new StorageError('quota', message, { cause: error });
  if (name === 'InvalidStateError' || name === 'SecurityError' || name === 'OpenFailedError') return new StorageError('unavailable', message, { cause: error });
  return new StorageError('unknown', message, { cause: error });
}
