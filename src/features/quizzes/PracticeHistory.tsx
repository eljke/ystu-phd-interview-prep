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
    <section className="info-card" aria-labelledby="practice-history-title">
      <h2 id="practice-history-title">Прошлые попытки</h2>
      <p>Откройте попытку, чтобы увидеть свой ответ, правильный вариант и пояснение.</p>
      {saved.map((attempt) => (
        <details key={attempt.id}>
          <summary>
            {new Date(attempt.completedAt).toLocaleString('ru-RU')} · {formatPercent(attempt.score)}
          </summary>
          <div className="quiz-card">
            {attempt.questionResults!.map((result, index) => {
              const item = byId.get(result.questionId);
              if (!item)
                return <p key={result.questionId}>Вопрос {index + 1} был из старой версии банка.</p>;
              const score = result.score ?? (result.correct ? 1 : 0);
              if (item.question.type === 'free-recall')
                return (
                  <article className="quiz-question" key={result.questionId}>
                    <strong>{item.question.prompt}</strong>
                    <p>Самооценка: {score === 1 ? 'уверенно' : score > 0 ? 'частично' : 'не смог'}.</p>
                    <p><strong>Ориентир:</strong> {item.question.modelAnswer}</p>
                  </article>
                );
              return (
                <article className="quiz-question" key={result.questionId}>
                  <strong>{item.question.prompt}</strong>
                  <p><strong>{result.correct ? 'Верно' : 'Ошибка'}</strong></p>
                  <p><strong>Ваш ответ:</strong> {formatGivenAnswer(item.question, attempt.answers[result.questionId] as QuizAnswer | undefined)}</p>
                  {!result.correct && <p><strong>Правильный ответ:</strong> {formatCorrectAnswer(item.question)}</p>}
                  <p>{item.question.explanation}</p>
                </article>
              );
            })}
          </div>
        </details>
      ))}
    </section>
  );
}
