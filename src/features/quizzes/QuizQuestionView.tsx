import type { QuizQuestion } from '../../entities/content/topic';
import type { QuizAnswer } from './scoreQuiz';

export function QuizQuestionView({
  question,
  answer,
  onChange,
  disabled,
  showResult,
}: {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  onChange: (answer: QuizAnswer) => void;
  disabled?: boolean;
  showResult?: boolean;
}) {
  if (question.type === 'single-choice')
    return (
      <fieldset className="quiz-options" disabled={disabled}>
        <legend>{question.prompt}</legend>
        {question.options.map((option) => (
          <label
            className={showResult ? (option.id === question.correctOptionId ? 'quiz-option--correct' : answer === option.id ? 'quiz-option--wrong' : '') : ''}
            key={option.id}
          >
            <input
              type="radio"
              name={question.id}
              checked={answer === option.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
    );
  if (question.type === 'multiple-choice') {
    const values = Array.isArray(answer) ? answer : [];
    return (
      <fieldset className="quiz-options" disabled={disabled}>
        <legend>{question.prompt}</legend>
        {question.options.map((option) => (
          <label
            className={showResult ? (question.correctOptionIds.includes(option.id) ? 'quiz-option--correct' : values.includes(option.id) ? 'quiz-option--wrong' : '') : ''}
            key={option.id}
          >
            <input
              type="checkbox"
              checked={values.includes(option.id)}
              onChange={() =>
                onChange(
                  values.includes(option.id)
                    ? values.filter((id) => id !== option.id)
                    : [...values, option.id],
                )
              }
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
    );
  }
  if (question.type === 'fill-blank')
    return (
      <label className="field">
        <span className="field__label">{question.prompt}</span>
        <input
          disabled={disabled}
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  if (question.type === 'ordering') {
    const values =
      Array.isArray(answer) && answer.length ? answer : question.items.map((item) => item.id);
    const move = (index: number, delta: number) => {
      const next = [...values];
      const target = index + delta;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target]!, next[index]!];
      onChange(next);
    };
    return (
      <div className="ordering">
        <h3>{question.prompt}</h3>
        {values.map((id, index) => {
          const item = question.items.find((candidate) => candidate.id === id);
          return (
            <div key={id}>
              <span>
                {index + 1}. {item?.text}
              </span>
              <button type="button" aria-label={`Поднять «${item?.text}»`} disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                aria-label={`Опустить «${item?.text}»`}
                disabled={disabled || index === values.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
            </div>
          );
        })}
      </div>
    );
  }
  const mapping = !Array.isArray(answer) && typeof answer === 'object' ? answer : {};
  const selectedRightIds = new Set(Object.values(mapping));
  return (
    <div className="matching">
      <h3>{question.prompt}</h3>
      {question.left.map((left) => (
        <label key={left.id}>
          <span>{left.text}</span>
          <select
            disabled={disabled}
            value={mapping[left.id] ?? ''}
            onChange={(e) => onChange({ ...mapping, [left.id]: e.target.value })}
          >
            <option value="">Выберите</option>
            {question.right.map((right) => (
              <option
                key={right.id}
                value={right.id}
                disabled={selectedRightIds.has(right.id) && mapping[left.id] !== right.id}
              >
                {right.text}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
