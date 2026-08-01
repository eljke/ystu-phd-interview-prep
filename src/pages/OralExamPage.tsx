import { Check, Clock3, Eye, Settings2, Shuffle, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProfiles } from '../app/providers/ProfileProvider';
import { useStudyRepository } from '../app/providers/RepositoryProvider';
import { topicById, topics } from '../content/topics';
import type { AppSettings, OralCriterionResult } from '../entities/progress/progress';
import { criterionScore, OralChecklistForm } from '../features/oral-exam/OralChecklistForm';
import { useCountdown } from '../features/oral-exam/useCountdown';
import { Button, LinkButton } from '../shared/ui/Button';
import { createId } from '../shared/utils/id';

const randomFrom = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const PREPARATION_OPTIONS = [0, 20, 30, 60];
const ANSWER_OPTIONS = [60, 90, 120, 180];

export function OralExamPage() {
  const [params] = useSearchParams();
  const specified = params.get('topic');
  const selectedParam = params.get('topics');
  const selectedIds = useMemo(() => selectedParam?.split(',').filter(Boolean), [selectedParam]);
  const pool = useMemo(
    () => selectedIds?.length ? topics.filter((topic) => selectedIds.includes(topic.id)) : topics,
    [selectedIds],
  );
  const initial = specified ? topicById.get(specified) : undefined;
  const [topic, setTopic] = useState(initial ?? randomFrom(pool) ?? topics[0]);
  const [phase, setPhase] = useState<'idle' | 'prep' | 'answer' | 'review'>('idle');
  const [startedAt, setStartedAt] = useState('');
  const [criteria, setCriteria] = useState<Record<string, OralCriterionResult>>({});
  const [confidence, setConfidence] = useState(0.6);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { activeProfileId } = useProfiles();
  const { repository, notifyDataChanged } = useStudyRepository();

  useEffect(() => {
    let active = true;
    void repository.getSettings().then((value) => {
      if (active) setSettings(value);
    });
    return () => { active = false; };
  }, [repository]);

  const toAnswer = useCallback(() => setPhase('answer'), []);
  const toReview = useCallback(() => setPhase('review'), []);
  const timerEnabled = settings?.oralTimerEnabled ?? true;
  const prepSeconds = settings?.oralPreparationSeconds ?? 20;
  const answerSeconds = settings?.oralAnswerSeconds ?? 90;
  const prep = useCountdown(prepSeconds, phase === 'prep' && timerEnabled, toAnswer);
  const answer = useCountdown(answerSeconds, phase === 'answer' && timerEnabled, toReview);

  if (!topic) return null;

  const choose = () => {
    setTopic(randomFrom(pool) ?? topics[0]);
    setPhase('idle');
    setCriteria({});
    setConfidence(0.6);
  };

  const start = () => {
    setStartedAt(new Date().toISOString());
    setPhase(timerEnabled && prepSeconds > 0 ? 'prep' : 'answer');
  };

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const current = settings ?? await repository.getSettings();
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    setSettings(next);
    await repository.saveSettings(next);
  };

  const save = async () => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const score = criterionScore(criteria);
    await repository.saveOralAttempt({
      id: createId('oral'),
      profileId: activeProfileId,
      topicId: topic.id,
      selfConfidence: confidence,
      oralScore: score,
      criteria: topic.oralChecklist.map((item) => ({
        criterionId: item.id,
        result: criteria[item.id] ?? 'missed',
      })),
      startedAt: startedAt || now,
      completedAt: now,
      updatedAt: now,
    });
    notifyDataChanged();
    choose();
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Устная тренировка</p>
          <h1>Сформулируйте ответ без подсказки</h1>
          <p>Таймер помогает держать темп, но не является официальным ограничением и может быть отключён.</p>
        </div>
        <Button variant="secondary" onClick={choose}><Shuffle size={17} /> Другая тема</Button>
      </header>

      <details className="oral-settings">
        <summary><Settings2 size={17} /> Настроить устный режим</summary>
        <div className="oral-settings__grid">
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(event) => void updateSettings({ oralTimerEnabled: event.target.checked })}
            />
            <span>Использовать таймер</span>
          </label>
          <label>
            <span>Подготовка</span>
            <select
              value={prepSeconds}
              disabled={!timerEnabled}
              onChange={(event) => void updateSettings({ oralPreparationSeconds: Number(event.target.value) })}
            >
              {PREPARATION_OPTIONS.map((value) => (
                <option key={value} value={value}>{value === 0 ? 'без подготовки' : `${value} секунд`}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Ответ</span>
            <select
              value={answerSeconds}
              disabled={!timerEnabled}
              onChange={(event) => void updateSettings({ oralAnswerSeconds: Number(event.target.value) })}
            >
              {ANSWER_OPTIONS.map((value) => <option key={value} value={value}>{value} секунд</option>)}
            </select>
          </label>
        </div>
      </details>

      <section className={`oral-stage oral-stage--${phase}`}>
        <div className="oral-stage__topic">
          <span className="topic-code">{topic.code}</span>
          <h2>{topic.originalText}</h2>
        </div>
        {phase === 'idle' && (
          <div className="oral-stage__action">
            <Volume2 size={42} />
            <p>Назовите определение, ключевые элементы и простой пример.</p>
            <Button onClick={start}>Начать попытку</Button>
          </div>
        )}
        {phase === 'prep' && <Timer value={prep} label="Подготовьте план ответа" onSkip={toAnswer} />}
        {phase === 'answer' && (
          timerEnabled
            ? <Timer value={answer} label="Отвечайте вслух" onSkip={toReview} />
            : <UntimedAnswer onComplete={toReview} />
        )}
        {phase === 'review' && (
          <div className="oral-review">
            <div className="answer-card answer-card--short">
              <p className="eyebrow"><Eye size={15} /> Эталонный каркас</p>
              <p>{topic.shortAnswer}</p>
            </div>
            <h3>Что прозвучало в ответе?</h3>
            <OralChecklistForm
              criteria={topic.oralChecklist}
              values={criteria}
              onChange={(id, value) => setCriteria((current) => ({ ...current, [id]: value }))}
            />
            <label className="confidence">
              <span>Насколько уверенно вы ответили: <strong>{Math.round(confidence * 100)}%</strong></span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
              />
            </label>
            <div className="button-row">
              <Button
                onClick={() => void save()}
                disabled={Object.keys(criteria).length < topic.oralChecklist.length}
              >
                <Check size={17} /> Сохранить попытку
              </Button>
              <LinkButton to={`/topics/${topic.id}`} variant="secondary">Открыть конспект</LinkButton>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Timer({ value, label, onSkip }: { value: number; label: string; onSkip: () => void }) {
  return (
    <div className="timer">
      <Clock3 />
      <span>{label}</span>
      <strong>{Math.floor(value / 60)}:{String(value % 60).padStart(2, '0')}</strong>
      <Button variant="ghost" onClick={onSkip}>Перейти дальше</Button>
    </div>
  );
}

function UntimedAnswer({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="oral-stage__action">
      <Volume2 size={42} />
      <p>Отвечайте в удобном темпе. Когда закончите, откройте эталонный каркас.</p>
      <Button onClick={onComplete}>Ответ закончен</Button>
    </div>
  );
}
