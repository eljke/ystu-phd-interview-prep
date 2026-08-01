import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LegacyDataMigration } from '../../features/migration/CloudMigrationPage';
import type { StudyRepository } from '../../repositories/StudyRepository';
import { getSupabaseClient } from '../../services/supabase/client';
import { DexieStudyRepository } from '../../storage/dexie/DexieStudyRepository';
import { StorageError } from '../../storage/dexie/databaseErrors';
import { SyncOutbox } from '../../storage/dexie/SyncOutbox';
import { YstuDatabase } from '../../storage/dexie/YstuDatabase';
import { MemoryStudyRepository } from '../../storage/memory/MemoryStudyRepository';
import { SupabaseStudyRepository } from '../../storage/supabase/SupabaseStudyRepository';
import { SyncingStudyRepository } from '../../storage/sync/SyncingStudyRepository';
import { Button } from '../../shared/ui/Button';
import { useAuth } from './AuthProvider';

interface RepositoryContextValue {
  repository: StudyRepository;
  revision: number;
  notifyDataChanged(): void;
  noSaveMode: boolean;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({
  children,
  repository: provided,
}: {
  children: ReactNode;
  repository?: StudyRepository;
}) {
  const { session, cloudEnabled } = useAuth();
  const resources = useMemo(() => {
    if (provided) return { local: provided, db: null };
    const db = new YstuDatabase();
    return { local: new DexieStudyRepository(db), db };
  }, [provided]);
  const [repository, setRepository] = useState(resources.local);
  const [status, setStatus] = useState<'loading' | 'migration' | 'ready' | 'error'>('loading');
  const [profiles, setProfiles] = useState<Awaited<ReturnType<StudyRepository['listProfiles']>>>(
    [],
  );
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [noSaveMode, setNoSaveMode] = useState(false);

  const connectCloud = useCallback(async () => {
    if (!session || !resources.db) return;
    const client = getSupabaseClient();
    if (!client) throw new Error('Облачная конфигурация недоступна.');
    const syncing = new SyncingStudyRepository(
      resources.local,
      new SupabaseStudyRepository(client, session.userId),
      new SyncOutbox(resources.db),
      session.userId,
    );
    await syncing.initialize();
    setRepository(syncing);
    setStatus('ready');
  }, [resources, session]);

  useEffect(() => {
    let active = true;
    void resources.local
      .initialize()
      .then(async () => {
        if (!active) return;
        if (!cloudEnabled || !session || !resources.db) {
          setRepository(resources.local);
          setStatus('ready');
          return;
        }
        const binding = await resources.db.userBindings.get(session.userId);
        if (!active) return;
        if (!binding) {
          setProfiles(await resources.local.listProfiles());
          setStatus('migration');
          return;
        }
        await connectCloud();
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : String(error));
          setStatus('error');
        }
      });
    return () => {
      active = false;
    };
  }, [cloudEnabled, connectCloud, resources, session]);

  if (status === 'loading')
    return (
      <main className="center-screen">
        <div className="loader" />
        <p>Открываем хранилище…</p>
      </main>
    );
  if (status === 'migration' && session && resources.db)
    return (
      <LegacyDataMigration
        profiles={profiles}
        repository={resources.local}
        db={resources.db}
        userId={session.userId}
        githubLogin={session.githubLogin}
        onComplete={connectCloud}
      />
    );
  if (status === 'error')
    return (
      <main className="center-screen">
        <section className="dialog">
          <h1>Не удалось открыть хранилище</h1>
          <p>{message}</p>
          <div className="button-row">
            <Button onClick={() => window.location.reload()}>Повторить</Button>
            {!cloudEnabled && (
              <Button
                variant="secondary"
                onClick={() => {
                  const memory = new MemoryStudyRepository();
                  setNoSaveMode(true);
                  void memory.initialize().then(() => {
                    setRepository(memory);
                    setStatus('ready');
                  });
                }}
              >
                Продолжить без сохранения
              </Button>
            )}
          </div>
        </section>
      </main>
    );
  return (
    <RepositoryContext.Provider
      value={{
        repository,
        revision,
        notifyDataChanged: () => setRevision((value) => value + 1),
        noSaveMode,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export function useStudyRepository() {
  const value = useContext(RepositoryContext);
  if (!value) throw new StorageError('unknown', 'RepositoryProvider is missing');
  return value;
}
