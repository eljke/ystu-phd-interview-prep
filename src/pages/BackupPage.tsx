import { Download, FileJson, Merge, ShieldCheck, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useProfiles } from '../app/providers/ProfileProvider';
import { useStudyRepository } from '../app/providers/RepositoryProvider';
import { CONTENT_VERSION } from '../content/program';
import type { BackupSnapshot } from '../entities/backup/backup';
import { verifyChecksum, withChecksum } from '../entities/backup/checksum';
import { mergeBackup } from '../entities/backup/mergeBackup';
import { parseBackup } from '../entities/backup/parseBackup';
import { Button } from '../shared/ui/Button';

interface ImportPreview {
  snapshot: BackupSnapshot;
  valid: boolean;
  message: string;
  newerFromImport: number;
  keptLocal: number;
  mergeAvailable: boolean;
  mergeMessage?: string;
}

export function BackupPage() {
  const { repository, notifyDataChanged } = useStudyRepository();
  const { refreshProfiles } = useProfiles();
  const input = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState('');

  const exportData = async () => {
    const snapshot = await withChecksum(await repository.exportSnapshot(CONTENT_VERSION));
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ystu-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const read = async (file: File) => {
    setDone('');
    try {
      const snapshot = parseBackup(await file.text());
      const valid = await verifyChecksum(snapshot);
      const local = await withChecksum(await repository.exportSnapshot(CONTENT_VERSION));
      let newerFromImport = 0;
      let keptLocal = 0;
      let mergeAvailable = valid;
      let mergeMessage: string | undefined;
      if (valid) {
        try {
          const comparison = mergeBackup(local, snapshot);
          newerFromImport = comparison.newerFromImport;
          keptLocal = comparison.keptLocal;
        } catch (error) {
          mergeAvailable = false;
          mergeMessage = error instanceof Error ? error.message : String(error);
        }
      }
      const versionMessage = snapshot.contentVersion === CONTENT_VERSION
        ? ''
        : ` Версия материалов в файле: ${snapshot.contentVersion}, текущая: ${CONTENT_VERSION}.`;
      setPreview({
        snapshot,
        valid,
        message: `${valid ? 'Контрольная сумма совпадает.' : 'Файл изменён после экспорта или повреждён.'}${versionMessage}`,
        newerFromImport,
        keptLocal,
        mergeAvailable,
        ...(mergeMessage ? { mergeMessage } : {}),
      });
    } catch (error) {
      setPreview(null);
      setDone(error instanceof Error ? error.message : String(error));
    }
  };

  const apply = async (mode: 'merge' | 'replace') => {
    if (!preview?.valid || (mode === 'merge' && !preview.mergeAvailable)) return;
    try {
      let target = preview.snapshot;
      if (mode === 'merge') {
        const local = await withChecksum(await repository.exportSnapshot(CONTENT_VERSION));
        target = await withChecksum(mergeBackup(local, preview.snapshot).merged);
      }
      await repository.replaceSnapshot(target);
      await refreshProfiles();
      notifyDataChanged();
      setDone(
        mode === 'merge'
          ? 'Данные объединены по времени последнего изменения.'
          : 'Локальные данные заменены резервной копией.',
      );
      setPreview(null);
    } catch (error) {
      setDone(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Локальные данные</p>
          <h1>Резервная копия</h1>
          <p>До подключения облачной синхронизации переносите общий прогресс JSON-файлом.</p>
        </div>
      </header>
      <section className="backup-grid">
        <article>
          <div className="backup-icon"><Download /></div>
          <h2>Экспортировать</h2>
          <p>Сохраните профили, прогресс, попытки, оценки партнёра и настройки. Файл содержит контрольную сумму.</p>
          <Button onClick={() => void exportData()}><FileJson size={17} /> Скачать JSON</Button>
        </article>
        <article>
          <div className="backup-icon"><Upload /></div>
          <h2>Импортировать</h2>
          <p>Приложение проверит структуру, контрольную сумму и покажет различия до применения.</p>
          <input
            ref={input}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void read(file);
              event.target.value = '';
            }}
          />
          <Button variant="secondary" onClick={() => input.current?.click()}><Upload size={17} /> Выбрать файл</Button>
        </article>
      </section>
      {preview && (
        <section className={`import-preview ${preview.valid ? 'import-preview--valid' : 'import-preview--invalid'}`}>
          <ShieldCheck />
          <div>
            <h2>{preview.valid ? 'Файл готов к импорту' : 'Проверка не пройдена'}</h2>
            <p>{preview.message}</p>
            <dl>
              <div><dt>Профили</dt><dd>{preview.snapshot.profiles.length}</dd></div>
              <div><dt>Отметки тем</dt><dd>{preview.snapshot.topicProgress.length}</dd></div>
              <div><dt>Тесты</dt><dd>{preview.snapshot.quizAttempts.length}</dd></div>
              <div><dt>Устные попытки</dt><dd>{preview.snapshot.oralAttempts.length}</dd></div>
              <div><dt>Новее в файле</dt><dd>{preview.newerFromImport}</dd></div>
              <div><dt>Новее локально</dt><dd>{preview.keptLocal}</dd></div>
            </dl>
            {preview.mergeMessage && <p className="form-error">{preview.mergeMessage}</p>}
            {preview.valid && (
              <div className="button-row">
                {preview.mergeAvailable && (
                  <Button onClick={() => void apply('merge')}><Merge size={17} /> Объединить — рекомендуется</Button>
                )}
                <Button variant="danger" onClick={() => void apply('replace')}>Полностью заменить</Button>
              </div>
            )}
          </div>
        </section>
      )}
      {done && <p className="notice" role="status">{done}</p>}
      <section className="info-card">
        <h2>Как работать на двух устройствах</h2>
        <ol>
          <li>Перед занятием экспортируйте свежую копию с устройства, где работали последним.</li>
          <li>На втором устройстве выберите «Объединить» — записи с более новым временем сохранятся.</li>
          <li>После совместной сессии снова сделайте экспорт.</li>
        </ol>
      </section>
    </>
  );
}
