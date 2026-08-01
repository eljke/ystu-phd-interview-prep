import { CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProfiles } from '../app/providers/ProfileProvider';
import { useStudyRepository } from '../app/providers/RepositoryProvider';
import { topics } from '../content/topics';
import { SECTION_LABELS, type QuizQuestion, type TopicSection } from '../entities/content/topic';
import type { QuizAttempt, TopicStatus } from '../entities/progress/progress';
import { QuizQuestionView } from '../features/quizzes/QuizQuestionView';
import {
  buildQuestionBank,
  selectPracticeQuestions,
  type QuestionBankItem,
} from '../features/quizzes/questionBank';
import { calculateQuizAnalytics } from '../features/quizzes/quizAnalytics';
import { readPracticeTopicIds } from '../features/quizzes/practiceScope';
import { isAnswerCorrect, type QuizAnswer } from '../features/quizzes/scoreQuiz';
import { Button } from '../shared/ui/Button';
import { formatPercent } from '../shared/utils/format';
import { createId } from '../shared/utils/id';

type PracticeMode = 'mixed' | 'objective' | 'recall' | 'review';
type RecallRating = 'knew' | 'partial' | 'missed';
const bank = buildQuestionBank(topics);
const sections: TopicSection[] = [
  'mathematical-modeling',
  'numerical-methods',
  'software-complexes',
];

function makeSet(
  mode: PracticeMode,
  pool: QuestionBankItem[],
  statuses: Map<string, TopicStatus>,
  recentQuestionIds: string[],
) {
  const reviewPool =
    mode === 'review'
      ? pool.filter((item) =>
          ['needs-review', 'studying'].includes(statuses.get(item.topicId) ?? ''),
        )
      : pool;
  const effectivePool = reviewPool.length >= 5 ? reviewPool : pool;
  const options = { bank: effectivePool, statuses, recentQuestionIds };
  const topicCount = new Set(effectivePool.map((item) => item.topicId)).size;
  if (topicCount === 1) {
    if (mode === 'recall')
      return selectPracticeQuestions({ ...options, count: 1, kind: 'free-recall' });
    if (mode === 'objective')
      return selectPracticeQuestions({ ...options, count: 5, kind: 'objective' });
    const objective = selectPracticeQuestions({ ...options, count: 4, kind: 'objective' });
    const recall = selectPracticeQuestions({ ...options, count: 1, kind: 'free-recall' });
    return [...objective, ...recall].sort(() => Math.random() - 0.5);
  }
  if (mode === 'objective')
    return selectPracticeQuestions({ ...options, count: 10, kind: 'objective' });
  if (mode === 'recall')
    return selectPracticeQuestions({ ...options, count: 8, kind: 'free-recall' });
  const objective = selectPracticeQuestions({ ...options, count: 7, kind: 'objective' });
  const usedTopics = new Set(objective.map((item) => item.topicId));
  const hasTopicVariety = new Set(effectivePool.map((item) => item.topicId)).size >= 4;
  const recall = selectPracticeQuestions({
    ...options,
    bank: effectivePool.filter((item) => !hasTopicVariety || !usedTopics.has(item.topicId)),
    count: 3,
    kind: 'free-recall',
  });
  return [...objective, ...recall].sort(() => Math.random() - 0.5);
}

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const requestedTopics = useMemo(() => readPracticeTopicIds(searchParams), [searchParams]);
  const { activeProfileId } = useProfiles();
  const { repository, notifyDataChanged } = useStudyRepository();
  const [mode, setMode] = useState<PracticeMode>('mixed');
  const [section, setSection] = useState<TopicSection | 'all'>('all');
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [statuses, setStatuses] = useState(new Map<string, TopicStatus>());
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [ratings, setRatings] = useState<Record<string, RecallRating>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<number | null>(null);

  const scopedBank = useMemo(
    () =>
      bank.filter(
        (item) =>
          (!requestedTopics.size || requestedTopics.has(item.topicId)) &&
          (section === 'all' || item.section === section),
      ),
    [requestedTopics, section],
  );
  const analytics = useMemo(() => calculateQuizAnalytics(attempts, topics), [attempts]);
  const recentIds = useMemo(
    () =>
      attempts
        .slice(-3)
        .flatMap((attempt) => attempt.questionResults?.map((item) => item.questionId) ?? []),
    [attempts],
  );

  const nextSet = useCallback(() => {
    setQuestions(makeSet(mode, scopedBank, statuses, recentIds));
    setAnswers({});
    setRatings({});
    setRevealed(new Set());
    setResult(null);
  }, [mode, recentIds, scopedBank, statuses]);

  useEffect(() => {
    if (!activeProfileId) return;
    void Promise.all([
      repository.listQuizAttempts(activeProfileId),
      repository.listTopicProgress(activeProfileId),
    ]).then(([history, progress]) => {
      setAttempts(history);
      setStatuses(new Map(progress.map((item) => [item.topicId, item.status])));
    });
  }, [activeProfileId, repository]);
  useEffect(() => {
    nextSet();
  }, [nextSet]);

  const complete = questions.every((item) =>
    item.kind === 'free-recall' ? Boolean(ratings[item.id]) : answers[item.id] !== undefined,
  );
  const submit = async () => {
    if (!activeProfileId) return;
    const questionResults = questions.map((item) => {
      const score =
        item.kind === 'free-recall'
          ? ratings[item.id] === 'knew'
            ? 1
            : ratings[item.id] === 'partial'
              ? 0.5
              : 0
          : isAnswerCorrect(item.question as QuizQuestion, answers[item.id])
            ? 1
            : 0;
      return { questionId: item.id, topicId: item.topicId, correct: score === 1, score };
    });
    const score = questionResults.reduce((sum, item) => sum + item.score, 0) / questions.length;
    const now = new Date().toISOString();
    await repository.saveQuizAttempt({
      id: createId('practice'),
      profileId: activeProfileId,
      topicId: requestedTopics.size === 1 ? [...requestedTopics][0]! : 'practice-mixed',
      correct: questionResults.filter((item) => item.correct).length,
      total: questions.length,
      score,
      answers,
      questionResults,
      mode: requestedTopics.size ? 'topic' : mode,
      completedAt: now,
      updatedAt: now,
    });
    for (const topicId of new Set(questionResults.map((item) => item.topicId))) {
      const topicResults = questionResults.filter((item) => item.topicId === topicId);
      const topicScore =
        topicResults.reduce((sum, item) => sum + item.score, 0) / topicResults.length;
      const current = await repository.getTopicProgress(activeProfileId, topicId);
      await repository.saveTopicProgress(
        current
          ? {
              ...current,
              status: topicScore < 0.6 ? 'needs-review' : current.status,
              updatedAt: now,
            }
          : {
              id: `${activeProfileId}:${topicId}`,
              profileId: activeProfileId,
              topicId,
              viewedSections: [],
              manualReview: false,
              status: topicScore < 0.6 ? 'needs-review' : 'studying',
              masteryScore: 0,
              updatedAt: now,
            },
      );
    }
    setResult(score);
    setAttempts(await repository.listQuizAttempts(activeProfileId));
    notifyDataChanged();
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Банк · {bank.length} вопросов</p>
          <h1>Тренировка без зубрёжки</h1>
          <p>
            В одном наборе не повторяем один и тот же тезис: проверяем смысл, термины и применение.
          </p>
        </div>
      </header>
      {!requestedTopics.size && (
        <section className="info-card">
          <div className="button-row">
            {(
              [
                ['mixed', 'Микс'],
                ['objective', 'Быстрый тест'],
                ['recall', 'Своими словами'],
                ['review', 'Слабые темы'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={mode === value ? 'primary' : 'secondary'}
                onClick={() => setMode(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <label className="field">
            <span className="field__label">Раздел</span>
            <select
              value={section}
              onChange={(event) => setSection(event.target.value as TopicSection | 'all')}
            >
              <option value="all">Вся программа</option>
              {sections.map((item) => (
                <option key={item} value={item}>
                  {SECTION_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      <section className="metric-grid">
        <article className="metric">
          <span>Личный результат</span>
          <strong>{formatPercent(analytics.accuracy)}</strong>
        </article>
        <article className="metric">
          <span>Моделирование</span>
          <strong>{formatPercent(analytics.bySection['mathematical-modeling'].accuracy)}</strong>
        </article>
        <article className="metric">
          <span>Численные методы</span>
          <strong>{formatPercent(analytics.bySection['numerical-methods'].accuracy)}</strong>
        </article>
        <article className="metric">
          <span>Комплексы программ</span>
          <strong>{formatPercent(analytics.bySection['software-complexes'].accuracy)}</strong>
        </article>
      </section>
      <section className="quiz-card">
        {questions.map((item, index) => (
          <div className="quiz-question" key={item.id}>
            <span className="question-number">
              {index + 1}. Тема {item.topicCode}
            </span>
            {item.question.type === 'free-recall' ? (
              <div>
                <h3>{item.question.prompt}</h3>
                <p className="notice">
                  Достаточно двух-трёх ясных фраз и одного простого примера.
                </p>
                {!revealed.has(item.id) ? (
                  <Button
                    variant="secondary"
                    onClick={() => setRevealed((current) => new Set(current).add(item.id))}
                  >
                    Показать ориентир
                  </Button>
                ) : (
                  <div className="answer-feedback answer-feedback--correct">
                    <div>
                      <strong>Простой ориентир</strong>
                      <p>{item.question.modelAnswer}</p>
                      <ul>
                        {item.question.checklist.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                      <div className="button-row">
                        <Button
                          variant={ratings[item.id] === 'knew' ? 'primary' : 'secondary'}
                          onClick={() =>
                            setRatings((current) => ({ ...current, [item.id]: 'knew' }))
                          }
                        >
                          Ответил уверенно
                        </Button>
                        <Button
                          variant={ratings[item.id] === 'partial' ? 'primary' : 'secondary'}
                          onClick={() =>
                            setRatings((current) => ({ ...current, [item.id]: 'partial' }))
                          }
                        >
                          Частично
                        </Button>
                        <Button
                          variant={ratings[item.id] === 'missed' ? 'primary' : 'secondary'}
                          onClick={() =>
                            setRatings((current) => ({ ...current, [item.id]: 'missed' }))
                          }
                        >
                          Не смог
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <QuizQuestionView
                  question={item.question}
                  answer={answers[item.id]}
                  disabled={result !== null}
                  onChange={(answer) =>
                    setAnswers((current) => ({ ...current, [item.id]: answer }))
                  }
                />
                {result !== null && (
                  <div
                    className={`answer-feedback ${isAnswerCorrect(item.question, answers[item.id]) ? 'answer-feedback--correct' : 'answer-feedback--wrong'}`}
                  >
                    {isAnswerCorrect(item.question, answers[item.id]) ? (
                      <CheckCircle2 />
                    ) : (
                      <XCircle />
                    )}
                    <div>
                      <strong>
                        {isAnswerCorrect(item.question, answers[item.id])
                          ? 'Верно'
                          : 'Разберите ещё раз'}
                      </strong>
                      <p>{item.question.explanation}</p>
                      <Link to={`/topics/${item.topicId}`}>Открыть простое объяснение темы</Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {result === null ? (
          <Button disabled={!complete || !questions.length} onClick={() => void submit()}>
            Завершить и посчитать
          </Button>
        ) : (
          <div className="quiz-result">
            <strong>{formatPercent(result)}</strong>
            <p>
              {result >= 0.7
                ? 'База уже держится. Повторите этот микс позже — с другими вопросами.'
                : 'Ошибки уже добавлены в приоритет повторения.'}
            </p>
            <Button variant="secondary" onClick={nextSet}>
              <RefreshCcw size={17} /> Новый набор
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
