import { ArrowRight, Bookmark, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Topic } from '../../entities/content/topic';
import type { MasteryResult } from '../../entities/progress/mastery';
import { SECTION_LABELS } from '../../entities/content/topic';
import { formatPercent } from '../../shared/utils/format';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { STATUS_LABELS } from './topicStatus';

export function TopicCard({
  topic,
  mastery,
  selected,
  onSelect,
}: {
  topic: Topic;
  mastery: MasteryResult | undefined;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const status = mastery?.status ?? 'not-started';
  const memoryLine = topic.keyPoints.map((point) => point.title).join(' → ');

  return (
    <article className={`topic-card topic-card--${topic.section}`}>
      <div className="topic-card__top">
        <span className="topic-code">{topic.code}</span>
        <span className={`status status--${status}`}>
          {status === 'mastered' && <CircleCheckBig size={14} />} {STATUS_LABELS[status]}
        </span>
      </div>
      <p className="topic-section">{SECTION_LABELS[topic.section]}</p>
      <h3>{topic.originalText}</h3>

      <details>
        <summary>Быстрый разбор</summary>
        <div className="details-content">
          <p>{topic.shortAnswer}</p>
          {memoryLine && (
            <p>
              <strong>Запомнить:</strong> {memoryLine}
            </p>
          )}
          <p>
            Полный разбор содержит объяснение на 1–2 минуты, ключевые понятия, формулы, пример,
            типичные ошибки и чек-лист устного ответа.
          </p>
        </div>
      </details>

      <div className="topic-card__bottom">
        <div className="topic-readiness">
          <span>{formatPercent(mastery?.score ?? 0)}</span>
          <ProgressBar value={mastery?.score ?? 0} />
        </div>
        {onSelect && (
          <button
            className={`select-button ${selected ? 'select-button--active' : ''}`}
            aria-pressed={selected}
            onClick={() => onSelect(topic.id)}
          >
            <Bookmark size={16} />
            {selected ? 'Выбрано' : 'В сессию'}
          </button>
        )}
        <Link
          aria-label={`Открыть полный разбор темы ${topic.code}`}
          title="Открыть полный разбор"
          to={`/topics/${topic.id}`}
          className="round-link"
        >
          <ArrowRight />
        </Link>
      </div>
    </article>
  );
}
