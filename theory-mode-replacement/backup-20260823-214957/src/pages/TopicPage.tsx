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
import { LinkButton } from '../shared/ui/Button';

export function TopicPage() {
  const { topicId } = useParams();
  const topic = topicId ? topicById.get(topicId) : undefined;
  const { activeProfileId } = useProfiles();
  const { repository, notifyDataChanged } = useStudyRepository();
  const { map } = useMasteryMap(activeProfileId);
  const [progress, setProgress] = useState<TopicProgress>();
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    if (activeProfileId && topic)
      repository.getTopicProgress(activeProfileId, topic.id).then(setProgress);
  }, [repository, activeProfileId, topic]);
  if (!topic)
    return (
      <div className="empty-state">
        <h1>Тема не найдена</h1>
        <Link to="/topics">Вернуться в каталог</Link>
      </div>
    );
  const save = async (next: TopicProgress) => {
    setProgress(next);
    await repository.saveTopicProgress(next);
    notifyDataChanged();
  };
  const markViewed = async (section: ViewedSection) => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const current = progress ?? {
      id: `${activeProfileId}:${topic.id}`,
      profileId: activeProfileId,
      topicId: topic.id,
      viewedSections: [],
      manualReview: false,
      status: 'studying',
      masteryScore: 0,
      updatedAt: now,
    };
    if (current.viewedSections.includes(section)) return;
    await save({
      ...current,
      viewedSections: [...current.viewedSections, section],
      status: 'studying',
      updatedAt: now,
    });
  };
  const toggleReview = async () => {
    if (!activeProfileId) return;
    const now = new Date().toISOString();
    const current = progress ?? {
      id: `${activeProfileId}:${topic.id}`,
      profileId: activeProfileId,
      topicId: topic.id,
      viewedSections: [],
      manualReview: false,
      status: 'not-started',
      masteryScore: 0,
      updatedAt: now,
    };
    await save({
      ...current,
      manualReview: !current.manualReview,
      status: !current.manualReview ? 'needs-review' : 'studying',
      updatedAt: now,
    });
  };
  const mastery = map.get(topic.id);
  return (
    <>
      <Link className="back-link" to="/topics">
        <ArrowLeft size={17} /> Все темы
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
      <section className="try-first">
        <div>
          <Sparkles />
          <h2>Сначала попробуйте ответить сами</h2>
          <p>
            Сформулируйте определение, 2–3 ключевых пункта и простой пример. Затем откройте каркас
            ответа.
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
          onToggle={(e) => {
            if (e.currentTarget.open) void markViewed('extendedAnswer');
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
          onToggle={(e) => {
            if (e.currentTarget.open) void markViewed('keyPoints');
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
            onToggle={(e) => {
              if (e.currentTarget.open) void markViewed('formulas');
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
            onToggle={(e) => {
              if (e.currentTarget.open) void markViewed('example');
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
          onToggle={(e) => {
            if (e.currentTarget.open) void markViewed('commonMistakes');
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
                        : (topic.keyPoints.find((p) => p.id === support)?.title ?? support),
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
