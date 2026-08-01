import { useEffect, useState } from 'react';
import type { Profile } from '../../entities/profile/profile';
import type { StudyRepository } from '../../repositories/StudyRepository';
import type { YstuDatabase } from '../../storage/dexie/YstuDatabase';
import { Button } from '../../shared/ui/Button';
import {
  migrateLegacyProfile,
  previewLegacyProfile,
  type MigrationPreview,
} from './legacyDataMigration';

export function LegacyDataMigration({
  profiles,
  repository,
  db,
  userId,
  githubLogin,
  onComplete,
}: {
  profiles: Profile[];
  repository: StudyRepository;
  db: YstuDatabase;
  userId: string;
  githubLogin: string;
  onComplete(): Promise<void>;
}) {
  const [previews, setPreviews] = useState<MigrationPreview[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all(profiles.map((profile) => previewLegacyProfile(repository, profile.id)))
      .then(setPreviews)
      .catch((reason: unknown) =>
        setMessage(
          reason instanceof Error ? reason.message : 'Не удалось проверить локальные данные.',
        ),
      );
  }, [profiles, repository]);

  const migrate = async (profileId: string | null) => {
    setBusy(true);
    setMessage('');
    try {
      await migrateLegacyProfile(repository, db, profileId, userId, githubLogin);
      await onComplete();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось перенести данные.');
      setBusy(false);
    }
  };

  return (
    <main className="center-screen">
      <section className="dialog">
        <h1>{profiles.length ? 'Выберите свой локальный профиль' : 'Создайте облачный профиль'}</h1>
        <p>
          Данные выбранного профиля будут скопированы в облако. Исходные данные останутся на
          устройстве.
        </p>
        <div className="button-row">
          {previews.map((preview) => (
            <Button
              key={preview.profileId}
              disabled={busy}
              onClick={() => void migrate(preview.profileId)}
            >
              {preview.profileName} ·{' '}
              {preview.progressCount + preview.quizCount + preview.oralCount} записей
            </Button>
          ))}
          {!profiles.length && (
            <Button disabled={busy} onClick={() => void migrate(null)}>
              Начать как @{githubLogin}
            </Button>
          )}
        </div>
        {message && <p role="alert">{message}</p>}
      </section>
    </main>
  );
}
