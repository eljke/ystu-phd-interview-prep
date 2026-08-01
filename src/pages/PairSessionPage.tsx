import { ArrowRightLeft, Check, RotateCcw, Shuffle, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProfiles } from '../app/providers/ProfileProvider';
import { useStudyRepository } from '../app/providers/RepositoryProvider';
import { topics } from '../content/topics';
import { rotateRoles } from '../entities/pair/roleRotation';
import {
  createPairTopicPool,
  sampleWithoutReplacement,
  type PairTopicMode,
} from '../entities/pair/topicPool';
import type { OralCriterionResult, StudySessionMode } from '../entities/progress/progress';
import { criterionScore, OralChecklistForm } from '../features/oral-exam/OralChecklistForm';
import { useMasteryMap } from '../features/progress/useMasteryMap';
import { Button, LinkButton } from '../shared/ui/Button';
import { createId } from '../shared/utils/id';

const MODE_LABELS: Record<PairTopicMode, string> = {
  all: 'Случайные темы всей программы',
  'responder-weak': 'Слабые темы отвечающего',
  'pair-weak': 'Слабые темы пары',
  'mock-interview': 'Пробное собеседование: 5 тем',
};

const SESSION_MODE: Record<PairTopicMode, StudySessionMode> = {
  all: 'random-section',
  'responder-weak': 'responder-weak',
  'pair-weak': 'pair-weak',
  'mock-interview': 'mock-interview',
};

const pickRandom = <T,>(items: readonly T[]): T | undefined =>
  items[Math.floor(Math.random() * items.length)];

export function PairSessionPage() {
  const { profiles } = useProfiles();
  const { repository, notifyDataChanged } = useStudyRepository();
  const firstMastery = useMasteryMap(profiles[0]?.id);
  const secondMastery = useMasteryMap(profiles[1]?.id);
  const [roles, setRoles] = useState({
    responderId: profiles[0]?.id ?? '',
    reviewerId: profiles[1]?.id ?? '',
  });
  const [mode, setMode] = useState<PairTopicMode>('all');
  const [topic, setTopic] = useState(() => pickRandom(topics));
  const [mockTopics, setMockTopics] = useState(() => sampleWithoutReplacement(topics, 5));
  const [mockIndex, setMockIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [criteria, setCriteria] = useState<Record<string, OralCriterionResult>>({});
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [sessionId, setSessionId] = useState(() => createId('session'));
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date().toISOString());
  const [attemptIds, setAttemptIds] = useState<string[]>([]);
  const [visitedTopicIds, setVisitedTopicIds] = useState<string[]>([]);

  const firstId = profiles[0]?.id;
  const responderScores = roles.responderId === firstId ? firstMastery.map : secondMastery.map;
  const reviewerScores = roles.reviewerId === firstId ? firstMastery.map : secondMastery.map;
  const rankedPool = useMemo(
    () => createPairTopicPool(topics, mode, responderScores, reviewerScores),
    [mode, responderScores, reviewerScores],
  );
  const activePool = mode === 'responder-weak' || mode === 'pair-weak' ? rankedPool.slice(0, 12) : rankedPool;
  const currentTopic = mode === 'mock-interview' ? mockTopics[mockIndex] : topic;
  const responder = profiles.find((profile) => profile.id === roles.responderId);
  const reviewer = profiles.find((profile) => profile.id === roles.reviewerId);

  const resetAnswer = () => {
    setRevealed(false);
    setCriteria({});
    setNotes('');
  };

  const resetSession = (nextMode: PairTopicMode = mode) => {
    const nextMockTopics = sampleWithoutReplacement(topics, 5);
    setMockTopics(nextMockTopics);
    setMockIndex(0);
    setTopic(pickRandom(createPairTopicPool(topics, nextMode, responderScores, reviewerScores).slice(0, nextMode === 'all' ? topics.length : 12)));
    setCompleted(false);
    setSessionId(createId('session'));
    setSessionStartedAt(new Date().toISOString());
    setAttemptIds([]);
    setVisitedTopicIds([]);
    resetAnswer();
  };

  const changeMode = (nextMode: PairTopicMode) => {
    setMode(nextMode);
    resetSession(nextMode);
  };

  const chooseAnother = () => {
    if (mode === 'mock-interview') {
      resetSession(mode);
      return;
    }
    setTopic(pickRandom(activePool));
    resetAnswer();
  };

  const swapRoles = () => {
    setRoles((current) => rotateRoles(current));
    resetAnswer();
  };

  const save = async () => {
    if (!currentTopic || profiles.length !== 2) return;
    const now = new Date().toISOString();
    const oralId = createId('oral');
    const score = criterionScore(criteria);
    const results = currentTopic.oralChecklist.map((item) => ({
      criterionId: item.id,
      result: criteria[item.id] ?? ('missed' as OralCriterionResult),
    }));

    await repository.saveOralAttempt({
      id: oralId,
      profileId: roles.responderId,
      topicId: currentTopic.id,
      selfConfidence: score,
      oralScore: score,
      criteria: results,
      startedAt: now,
      completedAt: now,
      updatedAt: now,
    });
    await repository.savePartnerAssessment({
      id: createId('assessment'),
      oralAttemptId: oralId,
      responderProfileId: roles.responderId,
      reviewerProfileId: roles.reviewerId,
      topicId: currentTopic.id,
      score,
      criteria: results,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      completedAt: now,
      updatedAt: now,
    });

    const nextAttemptIds = [...attemptIds, oralId];
    const nextTopicIds = visitedTopicIds.includes(currentTopic.id)
      ? visitedTopicIds
      : [...visitedTopicIds, currentTopic.id];
    const mockFinished = mode === 'mock-interview' && mockIndex >= mockTopics.length - 1;
    await repository.saveStudySession({
      id: sessionId,
      mode: SESSION_MODE[mode],
      participantIds: [profiles[0]!.id, profiles[1]!.id],
      topicIds: nextTopicIds,
      attemptIds: nextAttemptIds,
      startedAt: sessionStartedAt,
      ...(mockFinished ? { completedAt: now } : {}),
      updatedAt: now,
    });
    setAttemptIds(nextAttemptIds);
    setVisitedTopicIds(nextTopicIds);
    notifyDataChanged();

    const nextRoles = rotateRoles(roles);
    setRoles(nextRoles);
    resetAnswer();
    if (mockFinished) {
      setCompleted(true);
      return;
    }
    if (mode === 'mock-interview') {
      setMockIndex((index) => index + 1);
    } else {
      const nextResponderScores = nextRoles.responderId === firstId ? firstMastery.map : secondMastery.map;
      const nextReviewerScores = nextRoles.reviewerId === firstId ? firstMastery.map : secondMastery.map;
      const nextPool = createPairTopicPool(topics, mode, nextResponderScores, nextReviewerScores);
      const candidates = mode === 'all' ? nextPool : nextPool.slice(0, 12);
      setTopic(pickRandom(candidates));
    }
  };

  if (!currentTopic && !completed) return null;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Кооперативная подготовка</p>
          <h1>Парная сессия</h1>
          <p>Один отвечает без подсказки, второй отмечает ключевые элементы и затем обсуждает ответ.</p>
        </div>
        <Button variant="secondary" onClick={chooseAnother}>
          <Shuffle size={17} /> {mode === 'mock-interview' ? 'Новый набор' : 'Другая тема'}
        </Button>
      </header>

      <section className="session-controls" aria-label="Настройки парной сессии">
        <label>
          <span>Режим вопросов</span>
          <select value={mode} onChange={(event) => changeMode(event.target.value as PairTopicMode)}>
            {Object.entries(MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <p>
          {mode === 'mock-interview'
            ? `Вопрос ${Math.min(mockIndex + 1, mockTopics.length)} из ${mockTopics.length}`
            : `В пуле ${activePool.length} тем`}
        </p>
      </section>

      {completed ? (
        <section className="pair-complete">
          <Check size={42} />
          <h2>Пробное собеседование завершено</h2>
          <p>Разобрано 5 тем. Результаты сохранены обоим участникам и учтены в общей готовности.</p>
          <Button onClick={() => resetSession('mock-interview')}>
            <RotateCcw size={17} /> Начать новый набор
          </Button>
        </section>
      ) : currentTopic ? (
        <>
          <section className="roles">
            <article><span>Отвечает</span><strong>{responder?.name}</strong></article>
            <button className="role-swap" aria-label="Поменять роли" onClick={swapRoles}><ArrowRightLeft /></button>
            <article><span>Проверяет</span><strong>{reviewer?.name}</strong></article>
          </section>
          <section className="pair-card">
            <div className="pair-question">
              <span className="topic-code">{currentTopic.code}</span>
              <h2>{currentTopic.originalText}</h2>
              <p>Проверяющий не открывает шпаргалку до окончания ответа.</p>
            </div>
            {!revealed ? (
              <div className="pair-wait">
                <Users size={46} />
                <Button onClick={() => setRevealed(true)}>Ответ закончен — открыть проверку</Button>
              </div>
            ) : (
              <div className="pair-review">
                <div className="answer-card answer-card--short">
                  <p className="eyebrow">Короткий каркас</p>
                  <p>{currentTopic.shortAnswer}</p>
                </div>
                <h3>Оценка партнёра</h3>
                <OralChecklistForm
                  criteria={currentTopic.oralChecklist}
                  values={criteria}
                  onChange={(id, value) => setCriteria((current) => ({ ...current, [id]: value }))}
                />
                <label className="field">
                  <span className="field__label">Короткая заметка партнёра</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Что получилось и что повторить"
                    rows={3}
                  />
                </label>
                <div className="button-row">
                  <Button
                    onClick={() => void save()}
                    disabled={Object.keys(criteria).length < currentTopic.oralChecklist.length}
                  >
                    <Check size={17} />
                    {mode === 'mock-interview' && mockIndex === mockTopics.length - 1
                      ? 'Сохранить и завершить'
                      : 'Сохранить и поменять роли'}
                  </Button>
                  <LinkButton variant="secondary" to={`/topics/${currentTopic.id}`}>Открыть тему</LinkButton>
                </div>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
