import { Check, Clipboard, RefreshCcw, Trophy, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { topics } from '../content/topics';
import type { QuizQuestion } from '../entities/content/topic';
import { QuizQuestionView } from '../features/quizzes/QuizQuestionView';
import { buildQuestionBank, selectPracticeQuestions } from '../features/quizzes/questionBank';
import type { QuizAnswer } from '../features/quizzes/scoreQuiz';
import { toTournamentQuestion } from '../features/tournament/tournamentQuestions';
import type {
  PairInfo,
  PairTournamentRepository,
  TournamentState,
} from '../repositories/PairTournamentRepository';
import { getSupabaseClient } from '../services/supabase/client';
import { SupabasePairTournamentRepository } from '../storage/supabase/SupabasePairTournamentRepository';
import { Button } from '../shared/ui/Button';

const questionBank = buildQuestionBank(topics);
const questionById = new Map(questionBank.map((item) => [item.id, item]));

function answerText(question: QuizQuestion, answer: QuizAnswer | null): string {
  if (answer === null) return '—';
  if (question.type === 'single-choice')
    return question.options.find((item) => item.id === answer)?.text ?? String(answer);
  if (question.type === 'multiple-choice')
    return question.options
      .filter((item) => Array.isArray(answer) && answer.includes(item.id))
      .map((item) => item.text)
      .join('; ');
  if (question.type === 'ordering')
    return (Array.isArray(answer) ? answer : [])
      .map((id) => question.items.find((item) => item.id === id)?.text)
      .join(' → ');
  if (question.type === 'matching' && typeof answer === 'object' && !Array.isArray(answer))
    return question.left
      .map(
        (left) =>
          `${left.text} — ${question.right.find((right) => right.id === answer[left.id])?.text ?? '?'}`,
      )
      .join('; ');
  return String(answer);
}

export function PairSessionPage({ gateway: provided }: { gateway?: PairTournamentRepository }) {
  const { session, cloudEnabled } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gateway = useMemo(() => {
    if (provided) return provided;
    const client = getSupabaseClient();
    return client ? new SupabasePairTournamentRepository(client) : null;
  }, [provided]);
  const [pair, setPair] = useState<PairInfo | null>(null);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [answer, setAnswer] = useState<QuizAnswer>();
  const [inviteUrl, setInviteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!gateway) return;
    try {
      const [nextPair, nextTournament] = await Promise.all([
        gateway.getPair(),
        gateway.getActiveTournament(),
      ]);
      setPair(nextPair);
      if (nextTournament) setTournament(nextTournament);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось обновить турнир.');
    }
  }, [gateway]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const token = searchParams.get('invite');
    if (!token || !gateway) return;
    setBusy(true);
    void gateway
      .acceptInvite(token)
      .then(async () => {
        navigate('/pair', { replace: true });
        await refresh();
        setMessage('Пара создана. Можно начинать микротурнир.');
      })
      .catch((reason: unknown) =>
        setMessage(reason instanceof Error ? reason.message : 'Не удалось принять приглашение.'),
      )
      .finally(() => setBusy(false));
  }, [gateway, navigate, refresh, searchParams]);

  if (!cloudEnabled || !gateway)
    return (
      <main>
        <h1>Микротурнир доступен после входа</h1>
        <p>
          Соло-тренировка продолжает работать локально. Для честного турнира на двух устройствах
          нужна облачная авторизация.
        </p>
      </main>
    );

  const createInvite = async () => {
    setBusy(true);
    setMessage('');
    try {
      const invite = await gateway.createInvite();
      const url = `${window.location.origin}${window.location.pathname}#/pair?invite=${encodeURIComponent(invite.token)}`;
      setInviteUrl(url);
      await refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось создать приглашение.');
    } finally {
      setBusy(false);
    }
  };
  const start = async () => {
    setBusy(true);
    setMessage('');
    try {
      const selected = selectPracticeQuestions({ bank: questionBank, count: 7, kind: 'objective' });
      const questions = selected.map(toTournamentQuestion).filter((item) => item !== null);
      setTournament(await gateway.createTournament(questions));
      setAnswer(undefined);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось начать турнир.');
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!tournament || answer === undefined) return;
    setBusy(true);
    try {
      setTournament(await gateway.submitAnswer(tournament.id, tournament.currentRound, answer));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось зафиксировать ответ.');
    } finally {
      setBusy(false);
    }
  };
  const advance = async () => {
    if (!tournament) return;
    setBusy(true);
    try {
      setTournament(await gateway.advance(tournament.id));
      setAnswer(undefined);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось перейти дальше.');
    } finally {
      setBusy(false);
    }
  };

  const currentItem = tournament?.questionId ? questionById.get(tournament.questionId) : undefined;
  const question = currentItem?.question.type === 'free-recall' ? undefined : currentItem?.question;
  const opponent = pair?.members.find((member) => member.userId !== session?.userId);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Два устройства · закрытые ответы</p>
          <h1>Микротурнир</h1>
          <p>
            Одинаковые вопросы, ответы фиксируются независимо. Разбор и счёт откроются только после
            ответа обоих.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()}>
          <RefreshCcw size={17} /> Обновить
        </Button>
      </header>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {!pair || pair.members.length < 2 ? (
        <section className="pair-card">
          <Users size={42} />
          <h2>{pair ? 'Ждём второго участника' : 'Создайте пару'}</h2>
          <p>Ссылка действует 24 часа и принимается только GitHub-аккаунтом из whitelist.</p>
          <Button disabled={busy} onClick={() => void createInvite()}>
            Создать ссылку-приглашение
          </Button>
          {inviteUrl && (
            <div className="field">
              <span className="field__label">Отправьте партнёру</span>
              <input readOnly value={inviteUrl} />
              <Button
                variant="secondary"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                <Clipboard size={17} /> Копировать
              </Button>
            </div>
          )}
        </section>
      ) : !tournament || tournament.status === 'completed' ? (
        <section className="pair-complete">
          <Trophy size={46} />
          <h2>{tournament?.status === 'completed' ? 'Турнир завершён' : 'Пара готова'}</h2>
          {tournament?.status === 'completed' && (
            <p>
              Счёт: {tournament.myScore} : {tournament.opponentScore}
            </p>
          )}
          <p>7 случайных автопроверяемых вопросов из разных тем.</p>
          <Button disabled={busy} onClick={() => void start()}>
            Начать новый турнир
          </Button>
        </section>
      ) : question ? (
        <section className="pair-card">
          <div className="roles">
            <article>
              <span>Вы</span>
              <strong>{tournament.myScore}</strong>
            </article>
            <article>
              <span>{opponent?.displayName ?? 'Партнёр'}</span>
              <strong>{tournament.opponentScore}</strong>
            </article>
          </div>
          <div className="pair-question">
            <span className="topic-code">
              Раунд {tournament.currentRound + 1} / {tournament.totalRounds} · тема{' '}
              {currentItem?.topicCode}
            </span>
            <QuizQuestionView
              question={question}
              answer={answer}
              disabled={tournament.submitted || busy}
              onChange={setAnswer}
            />
          </div>
          {!tournament.submitted ? (
            <Button disabled={answer === undefined || busy} onClick={() => void submit()}>
              <Check size={17} /> Зафиксировать ответ
            </Button>
          ) : !tournament.revealed ? (
            <div className="pair-wait">
              <Users size={42} />
              <h3>Ответ зафиксирован</h3>
              <p>Ответ партнёра и правильный вариант пока скрыты. Ждём второго участника.</p>
            </div>
          ) : (
            <div className="pair-review">
              <div className="answer-card answer-card--short">
                <p className="eyebrow">Ваш ответ · {tournament.myRoundScore} балл</p>
                <p>{answerText(question, tournament.myAnswer)}</p>
                <p className="eyebrow">Ответ партнёра · {tournament.opponentRoundScore} балл</p>
                <p>{answerText(question, tournament.opponentAnswer)}</p>
                <p className="eyebrow">Правильный ответ</p>
                <p>{answerText(question, tournament.correctAnswer as QuizAnswer)}</p>
                <strong>Почему так</strong>
                <p>{tournament.explanation}</p>
              </div>
              <Button disabled={busy} onClick={() => void advance()}>
                {tournament.currentRound + 1 === tournament.totalRounds
                  ? 'Завершить турнир'
                  : 'Следующий раунд'}
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="notice">
          <p>Вопрос не найден в текущей версии банка. Обновите приложение.</p>
        </section>
      )}
    </>
  );
}
