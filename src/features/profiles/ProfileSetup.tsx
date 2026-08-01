import { Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useProfiles } from '../../app/providers/ProfileProvider';
import { useStudyRepository } from '../../app/providers/RepositoryProvider';
import { Button } from '../../shared/ui/Button';
import { Field } from '../../shared/ui/Field';
import { createId } from '../../shared/utils/id';

export function ProfileSetup() {
  const { repository } = useStudyRepository();
  const { refreshProfiles } = useProfiles();
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const firstName = first.trim();
    const secondName = second.trim();
    if (firstName.length < 2 || secondName.length < 2) {
      setError('Введите два имени длиной не менее двух символов.');
      return;
    }
    if (firstName.toLocaleLowerCase('ru') === secondName.toLocaleLowerCase('ru')) {
      setError('Имена участников должны различаться.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const ids = [createId('profile'), createId('profile')] as const;
      await Promise.all([
        repository.saveProfile({ id: ids[0], name: firstName, createdAt: now, updatedAt: now }),
        repository.saveProfile({ id: ids[1], name: secondName, createdAt: now, updatedAt: now }),
      ]);
      const settings = await repository.getSettings();
      await repository.saveSettings({ ...settings, activeProfileId: ids[0], updatedAt: now });
      await refreshProfiles();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить профили.');
      setSaving(false);
    }
  };

  return (
    <main className="onboarding">
      <section className="onboarding__panel">
        <div className="brand-mark"><Users size={28} /></div>
        <p className="eyebrow">Аспирантура ЯГТУ · 1.2.2</p>
        <h1>Готовьтесь вдвоём, отвечайте уверенно</h1>
        <p className="lead">
          Все 43 темы доступны сразу. Прогресс хранится только в этом браузере; обязательной дневной нормы нет.
        </p>
        <form onSubmit={submit} className="setup-form">
          <Field label="Первый участник">
            <input value={first} onChange={(event) => setFirst(event.target.value)} autoComplete="off" placeholder="Имя" />
          </Field>
          <Field label="Второй участник">
            <input value={second} onChange={(event) => setSecond(event.target.value)} autoComplete="off" placeholder="Имя" />
          </Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button disabled={saving} type="submit">{saving ? 'Сохраняем…' : 'Начать подготовку'}</Button>
        </form>
        <p className="privacy-note">Позже данные можно экспортировать в JSON и перенести на другое устройство.</p>
      </section>
      <aside className="onboarding__aside">
        <div><span className="big-number">43</span><p>официальные темы без добавленных экзаменационных вопросов</p></div>
        <div><span className="big-number">2</span><p>режима проверки: мини-тест и устный ответ</p></div>
        <div><span className="big-number">∞</span><p>свободный темп: длинные занятия и дни отдыха</p></div>
      </aside>
    </main>
  );
}
