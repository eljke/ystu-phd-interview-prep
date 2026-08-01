import type { QuizQuestion } from '../../entities/content/topic';
import type { QuizAttempt } from '../../entities/progress/progress';
import { formatPercent } from '../../shared/utils/format';
import type { QuestionBankItem } from './questionBank';
import type { QuizAnswer } from './scoreQuiz';

function optionText(question: QuizQuestion, id: string): string {
  if (question.type === 'single-choice' || question.type === 'multiple-choice')
    return question.options.find((option) => option.id === id)?.text ?? id;
  return id;
}

export function formatGivenAnswer(question: QuizQuestion, answer: QuizAnswer | undefined): string {
  if (answer === undefined) return 'Нет ответа';
  if (question.type === 'single-choice')
    return typeof answer === 'string' ? optionText(question, answer) : 'Нет ответа';
  if (question.type === 'multiple-choice')
    return Array.isArray(answer) ? answer.map((id) => optionText(question, id)).join('; ') : 'Нет ответа';
  if (question.type === 'fill-blank') return typeof answer === 'string' ? answer : 'Нет ответа';
  if (question.type === 'ordering')
    return Array.isArray(answer)
      ? answer.map((id) => question.items.find((item) => item.id === id)?.text ?? id).join(' → ')
      : 'Нет ответа';
  if (Array.isArray(answer) || typeof answer !== 'object') return 'Нет ответа';
  return question.left
    .map((left) => {
      const rightId = answer[left.id];
      const right = question.right.find((item) => item.id === rightId)?.text ?? 'не выбрано';
      return `${left.text} — ${right}`;
    })
    .join('; ');
}

export function formatCorrectAnswer(question: QuizQuestion): string {
  if (question.type === 'single-choice') return optionText(question, question.correctOptionId);
  if (question.type === 'multiple-choice')
    return question.correctOptionIds.map((id) => optionText(question, id)).join('; ');
  if (question.type === 'fill-blank') return question.acceptedAnswers[0] ?? '';
  if (question.type === 'ordering')
    return question.correctOrder
      .map((id) => question.items.find((item) => item.id === id)?.text ?? id)
      .join(' → ');
  return question.left
    .map((left) => {
      const rightId = question.pairs[left.id];
      const right = question.right.find((item) => item.id === rightId)?.text ?? rightId;
      return `${left.text} — ${right}`;
    })
    .join('; ');
}

export function PracticeHistory({ attempts, bank }: { attempts: QuizAttempt[]; bank: QuestionBankItem[] }) {
  const byId = new Map(bank.map((item) => [item.id, item]));
  const saved = attempts.filter((attempt) => attempt.questionResults?.length).slice(-10).reverse();
  if (!saved.length) return null;
  return (
    <section className="practice-history" aria-labelledby="practice-history-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">История</span>
          <h2 id="practice-history-title">Прошлые попытки</h2>
        </div>
        <p>Последние 10 результатов с разбором каждого ответа.</p>
      </div>
      <div className="attempt-list">
        {saved.map((attempt) => (
          <details className="attempt-card" key={attempt.id}>
            <summary>
              <span>
                <strong>{formatPercent(attempt.score)}</strong>
                <small>{attempt.correct} из {attempt.total} без ошибок</small>
              </span>
              <time dateTime={attempt.completedAt}>
                {new Date(attempt.completedAt).toLocaleString('ru-RU')}
              </time>
            </summary>
            <div className="attempt-review">
            {attempt.questionResults!.map((result, index) => {
              const item = byId.get(result.questionId);
              if (!item)
                return <p className="muted" key={result.questionId}>Вопрос {index + 1} был из старой версии банка.</p>;
              const score = result.score ?? (result.correct ? 1 : 0);
              if (item.question.type === 'free-recall')
                return (
                  <article className="review-item" key={result.questionId}>
                    <div className="review-item__header">
                      <span className="question-number">Тема {item.topicCode} · {item.topicTitle}</span>
                      <span className={`result-badge ${score === 1 ? 'result-badge--correct' : 'result-badge--partial'}`}>
                        {score === 1 ? 'Уверенно' : score > 0 ? 'Частично' : 'Нужно повторить'}
                      </span>
                    </div>
                    <h3>{item.question.prompt}</h3>
                    <div className="review-explanation"><strong>Вариант ответа</strong><p>{item.question.modelAnswer}</p></div>
                  </article>
                );
              return (
                <article className="review-item" key={result.questionId}>
                  <div className="review-item__header">
                    <span className="question-number">Тема {item.topicCode} · {item.topicTitle}</span>
                    <span className={`result-badge ${result.correct ? 'result-badge--correct' : 'result-badge--wrong'}`}>
                      {result.correct ? 'Верно' : 'Ошибка'}
                    </span>
                  </div>
                  <h3>{item.question.prompt}</h3>
                  <div className="answer-comparison">
                    <p><span>Ваш ответ</span>{formatGivenAnswer(item.question, attempt.answers[result.questionId] as QuizAnswer | undefined)}</p>
                    {!result.correct && <p><span>Правильный ответ</span>{formatCorrectAnswer(item.question)}</p>}
                  </div>
                  <div className="review-explanation"><strong>Почему так</strong><p>{item.question.explanation}</p></div>
                </article>
              );
            })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
