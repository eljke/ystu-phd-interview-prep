import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Sigma,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProfiles } from '../app/providers/ProfileProvider';
import { useStudyRepository } from '../app/providers/RepositoryProvider';
import { topicById } from '../content/topics';
import type { TopicProgress, ViewedSection } from '../entities/progress/progress';
import { useMasteryMap } from '../features/progress/useMasteryMap';
import { STATUS_LABELS } from '../features/topics/topicStatus';
import '../shared/styles/topic-theory.css';
import { LinkButton } from '../shared/ui/Button';

type TopicMode = 'study' | 'practice';

export function TopicPage() {
  const { topicId } = useParams();
  const topic = topicId ? topicById.get(topicId) : undefined;
  const { activeProfileId } = useProfiles();
  const { repository, notifyDataChanged } = useStudyRepository();
  const { map } = useMasteryMap(activeProfileId);
  const [progress, setProgress] = useState<TopicProgress>();
  const [reveal, setReveal] = useState(false);
  const [mode, setMode] = useState<TopicMode>('study');

  useEffect(() => {
    if (activeProfileId && topic) {
      void repository.getTopicProgress(activeProfileId, topic.id).then(setProgress);
    }
  }, [repository, activeProfileId, topic]);

  if (!topic) {
    return (
      <div className="empty-state">
        <h1>Тема не найдена</h1>
        <Link to="/topics">Вернуться в каталог</Link>
      </div>
    );
  }

  const save = async (next: TopicProgress) => {
    setProgress(next);
    await repository.saveTopicProgress(next);
    notifyDataChanged();
  };

  const getCurrentProgress = (
    profileId: string,
    initialStatus: TopicProgress['status'],
  ): TopicProgress => {
    const now = new Date().toISOString();
    return (
      progress ?? {
        id: `${profileId}:${topic.id}`,
        profileId,
        topicId: topic.id,
        viewedSections: [],
        manualReview: false,
        status: initialStatus,
        masteryScore: 0,
        updatedAt: now,
      }
    );
  };

  const markViewed = async (section: ViewedSection) => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const current = getCurrentProgress(activeProfileId, 'studying');
    if (current.viewedSections.includes(section)) return;
    await save({
      ...current,
      viewedSections: [...current.viewedSections, section],
      status: current.status === 'mastered' ? 'mastered' : 'studying',
      updatedAt: now,
    });
  };

  const markTheoryViewed = async () => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const current = getCurrentProgress(activeProfileId, 'studying');
    const theorySections: ViewedSection[] = [
      'shortAnswer',
      'extendedAnswer',
      'keyPoints',
      'commonMistakes',
    ];
    if (topic.formulas.length > 0) theorySections.push('formulas');
    if (topic.example) theorySections.push('example');

    await save({
      ...current,
      viewedSections: Array.from(new Set([...current.viewedSections, ...theorySections])),
      status: current.status === 'mastered' ? 'mastered' : 'studying',
      updatedAt: now,
    });
  };

  const toggleReview = async () => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const current = getCurrentProgress(activeProfileId, 'not-started');
    await save({
      ...current,
      manualReview: !current.manualReview,
      status: !current.manualReview ? 'needs-review' : 'studying',
      updatedAt: now,
    });
  };

  const mastery = map.get(topic.id);
  const memoryLine = topic.keyPoints.map((point) => point.title).join(' → ');

  return (
    <>
      <Link className="back-link" to="/topics">
        <ArrowLeft size={17} /> База знаний
      </Link>

      <header className={`topic-hero topic-hero--${topic.section}`}>
        <div>
          <p className="eyebrow">Тема {topic.code}</p>
          <h1>{topic.originalText}</h1>
          {topic.sourceNote && (
            <p className="source-note">
              <AlertTriangle size={17} />
              {topic.sourceNote}
            </p>
          )}
        </div>
        <div className="topic-hero__status">
          <span>Статус</span>
          <strong>{STATUS_LABELS[mastery?.status ?? 'not-started']}</strong>
          <button
            className={`button button--${progress?.manualReview ? 'secondary' : 'ghost'}`}
            onClick={() => void toggleReview()}
          >
            {progress?.manualReview ? 'Отмечено для повторения' : 'Повторить позже'}
          </button>
        </div>
      </header>

      <div className="topic-mode" role="group" aria-label="Режим работы с темой">
        <button
          className={`topic-mode__button ${mode === 'study' ? 'topic-mode__button--active' : ''}`}
          aria-pressed={mode === 'study'}
          onClick={() => setMode('study')}
        >
          <BookOpenCheck size={18} />
          <span>
            <strong>Изучить теорию</strong>
            <small>Спокойно разобрать тему с нуля</small>
          </span>
        </button>
        <button
          className={`topic-mode__button ${mode === 'practice' ? 'topic-mode__button--active' : ''}`}
          aria-pressed={mode === 'practice'}
          onClick={() => setMode('practice')}
        >
          <Sparkles size={18} />
          <span>
            <strong>Проверить себя</strong>
            <small>Сначала ответить, потом открыть подсказки</small>
          </span>
        </button>
      </div>

      {mode === 'study' ? (
        <div className="theory-flow">
          <section className="theory-card theory-card--lead">
            <p className="eyebrow">Суть простыми словами</p>
            <h2>Что нужно понять в первую очередь</h2>
            <p className="theory-lead">{topic.shortAnswer}</p>
            {memoryLine && (
              <div className="theory-memory">
                <Sparkles size={18} />
                <div>
                  <span>Опорная цепочка</span>
                  <strong>{memoryLine}</strong>
                </div>
              </div>
            )}
          </section>

          <section className="theory-card">
            <div className="theory-heading">
              <div>
                <p className="eyebrow">Разбор по пунктам</p>
                <h2>На чём держится тема</h2>
              </div>
              <span className="counter-pill">{topic.keyPoints.length}</span>
            </div>
            <div className="theory-points">
              {topic.keyPoints.map((point, index) => (
                <article key={point.id}>
                  <span className="theory-point-number">{index + 1}</span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.explanation}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="theory-card">
            <p className="eyebrow">Если попросят раскрыть подробнее</p>
            <h2>Объяснение на 1–2 минуты</h2>
            <p className="theory-prose">{topic.extendedAnswer}</p>
          </section>

          {topic.formulas.length > 0 && (
            <section className="theory-card">
              <div className="theory-heading">
                <div>
                  <p className="eyebrow">Минимум формул</p>
                  <h2>Что стоит узнавать и уметь пояснить</h2>
                </div>
                <Sigma size={22} />
              </div>
              <div className="formula-list">
                {topic.formulas.map((formula) => (
                  <article key={formula.id}>
                    <code>{formula.plainText}</code>
                    <p>{formula.explanation}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {topic.example && (
            <section className="theory-card theory-card--example">
              <div className="theory-heading">
                <div>
                  <p className="eyebrow">Простой пример</p>
                  <h2>Как представить идею на практике</h2>
                </div>
                <Lightbulb size={22} />
              </div>
              <p className="theory-prose">{topic.example}</p>
            </section>
          )}

          <section className="theory-card theory-card--warning">
            <div className="theory-heading">
              <div>
                <p className="eyebrow">Что не перепутать</p>
                <h2>Типичные ошибки</h2>
              </div>
              <AlertTriangle size={22} />
            </div>
            <ul className="theory-list">
              {topic.commonMistakes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="theory-card theory-card--answer-plan">
            <p className="eyebrow">Ответ комиссии</p>
            <h2>Как построить связный ответ</h2>
            <p className="theory-prose">
              Не нужно заучивать конспект дословно. Держите в голове эту последовательность и
              раскрывайте пункты своими словами.
            </p>
            <ol className="answer-steps">
              <li>
                <strong>Начните с сути.</strong>
                <span>Коротко сформулируйте, что это такое и о чём тема.</span>
              </li>
              {topic.keyPoints.map((point) => (
                <li key={point.id}>
                  <strong>{point.title}</strong>
                  <span>Поясните этот пункт одним-двумя предложениями.</span>
                </li>
              ))}
              {topic.example && (
                <li>
                  <strong>Приведите пример.</strong>
                  <span>Закрепите объяснение уже разобранным простым примером.</span>
                </li>
              )}
            </ol>
          </section>

          <div className="theory-complete">
            <div>
              <strong>Теория разобрана</strong>
              <span>Можно отметить просмотр и перейти к самопроверке.</span>
            </div>
            <div className="theory-complete__actions">
              <button className="button button--ghost" onClick={() => void markTheoryViewed()}>
                <CheckCircle2 size={17} /> Отметить как просмотренное
              </button>
              <button className="button button--primary" onClick={() => setMode('practice')}>
                Проверить себя
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="try-first">
            <div>
              <Sparkles />
              <h2>Сначала попробуйте ответить сами</h2>
              <p>
                Сформулируйте определение, 2–3 ключевых пункта и простой пример. Затем откройте
                каркас ответа.
              </p>
            </div>
            <button
              className="button button--primary"
              onClick={() => {
                setReveal(true);
                void markViewed('shortAnswer');
              }}
            >
              {reveal ? 'Каркас открыт' : 'Показать ответ на 30–60 секунд'}
            </button>
          </section>

          {reveal && (
            <section className="answer-card answer-card--short">
              <p className="eyebrow">Короткий ответ</p>
              <p>{topic.shortAnswer}</p>
            </section>
          )}

          <div className="layer-stack">
            <details
              onToggle={(event) => {
                if (event.currentTarget.open) void markViewed('extendedAnswer');
              }}
            >
              <summary>
                <BookOpenCheck /> Ответ на 1–2 минуты
              </summary>
              <div className="details-content">
                <p>{topic.extendedAnswer}</p>
              </div>
            </details>
            <details
              onToggle={(event) => {
                if (event.currentTarget.open) void markViewed('keyPoints');
              }}
            >
              <summary>
                <ListChecks /> Ключевые понятия
              </summary>
              <div className="key-point-grid">
                {topic.keyPoints.map((point) => (
                  <article key={point.id}>
                    <h3>{point.title}</h3>
                    <p>{point.explanation}</p>
                  </article>
                ))}
              </div>
            </details>
            {topic.formulas.length > 0 && (
              <details
                onToggle={(event) => {
                  if (event.currentTarget.open) void markViewed('formulas');
                }}
              >
                <summary>
                  <Sigma /> Формулы
                </summary>
                <div className="formula-list">
                  {topic.formulas.map((formula) => (
                    <article key={formula.id}>
                      <code>{formula.plainText}</code>
                      <p>{formula.explanation}</p>
                    </article>
                  ))}
                </div>
              </details>
            )}
            {topic.example && (
              <details
                onToggle={(event) => {
                  if (event.currentTarget.open) void markViewed('example');
                }}
              >
                <summary>
                  <Lightbulb /> Простой пример
                </summary>
                <div className="details-content">
                  <p>{topic.example}</p>
                </div>
              </details>
            )}
            <details
              onToggle={(event) => {
                if (event.currentTarget.open) void markViewed('commonMistakes');
              }}
            >
              <summary>
                <AlertTriangle /> Типичные ошибки
              </summary>
              <div className="details-content">
                <ul>
                  {topic.commonMistakes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </>
      )}

      <section className="oral-checklist">
        <p className="eyebrow">Чек-лист связного ответа</p>
        <h2>Что должно прозвучать</h2>
        {topic.oralChecklist.map((item) => (
          <div key={item.id}>
            <CheckCircle2 />
            <span>{item.label}</span>
            {item.critical && <small>важно</small>}
          </div>
        ))}
      </section>

      <section className="topic-actions">
        <LinkButton to={`/quiz/${topic.id}`}>
          <ListChecks size={18} /> Пройти мини-тест
        </LinkButton>
        <LinkButton to={`/practice?topic=${topic.id}`} variant="secondary">
          <GraduationCap size={18} /> Закрепить разными вопросами
        </LinkButton>
      </section>

      <section className="sources">
        <p className="eyebrow">Источники</p>
        <h2>На что опирается конспект</h2>
        <div className="source-grid">
          {topic.sources.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <div>
                <strong>{source.title}</strong>
                <span>
                  Подтверждает:{' '}
                  {source.supports
                    .map((support) =>
                      support === 'shortAnswer'
                        ? 'краткий ответ'
                        : (topic.keyPoints.find((point) => point.id === support)?.title ?? support),
                    )
                    .join(', ')}
                </span>
              </div>
              <ExternalLink size={18} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
