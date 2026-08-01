import {
  type QuizQuestion,
  type Topic,
  type TopicSection,
} from '../../entities/content/topic';
import type { TopicStatus } from '../../entities/progress/progress';
import { createOrderingQuestion } from './orderingQuestions';
import { createTermQuestion } from './termQuestions';

export interface QuestionBankItem {
  id: string;
  topicId: string;
  topicCode: string;
  topicTitle: string;
  section: TopicSection;
  kind: 'objective' | 'free-recall';
  question: QuizQuestion | RecallQuestion;
  sourceTitles: string[];
}

export interface RecallQuestion {
  id: string;
  type: 'free-recall';
  prompt: string;
  modelAnswer: string;
  checklist: string[];
}

export function buildQuestionBank(topics: readonly Topic[]): QuestionBankItem[] {
  return topics.flatMap((topic) => {
    const authored = topic.quiz.map((question) => ({
      id: `${topic.id}:${question.id}`,
      topicId: topic.id,
      topicCode: topic.code,
      topicTitle: topic.originalText,
      section: topic.section,
      kind: 'objective' as const,
      question: { ...question, id: `${topic.id}:${question.id}` },
      sourceTitles: topic.sources.map((source) => source.title),
    }));
    const termQuestion = topic.quiz.some((question) => question.type === 'fill-blank')
      ? null
      : createTermQuestion(topic);
    const term = termQuestion
      ? [
          {
            id: termQuestion.id,
            topicId: topic.id,
            topicCode: topic.code,
            topicTitle: topic.originalText,
            section: topic.section,
            kind: 'objective' as const,
            question: termQuestion,
            sourceTitles: topic.sources.map((source) => source.title),
          },
        ]
      : [];
    const orderingQuestion = topic.quiz.some((question) => question.type === 'ordering')
      ? null
      : createOrderingQuestion(topic);
    const ordering = orderingQuestion
      ? [
          {
            id: orderingQuestion.id,
            topicId: topic.id,
            topicCode: topic.code,
            topicTitle: topic.originalText,
            section: topic.section,
            kind: 'objective' as const,
            question: orderingQuestion,
            sourceTitles: topic.sources.map((source) => source.title),
          },
        ]
      : [];
    const selectedPoints = topic.keyPoints.slice(0, 3);
    const matchingId = `${topic.id}:matching`;
    const matching: QuestionBankItem = {
      id: matchingId,
      topicId: topic.id,
      topicCode: topic.code,
      topicTitle: topic.originalText,
      section: topic.section,
      kind: 'objective',
      question: {
        id: matchingId,
        type: 'matching',
        prompt: `Соберите тему ${topic.code}: что здесь что означает?`,
        explanation: 'Это основные понятия темы и их смысл.',
        keyPointIds: selectedPoints.map((point) => point.id),
        left: selectedPoints.map((point) => ({
          id: `${matchingId}:l:${point.id}`,
          text: point.title,
        })),
        right: selectedPoints.map((point) => ({
          id: `${matchingId}:r:${point.id}`,
          text: point.explanation,
        })),
        pairs: Object.fromEntries(
          selectedPoints.map((point) => [
            `${matchingId}:l:${point.id}`,
            `${matchingId}:r:${point.id}`,
          ]),
        ),
      },
      sourceTitles: topic.sources.map((source) => source.title),
    };
    const recall: QuestionBankItem = {
      id: `${topic.id}:recall`,
      topicId: topic.id,
      topicCode: topic.code,
      topicTitle: topic.originalText,
      section: topic.section,
      kind: 'free-recall',
      question: {
        id: `${topic.id}:recall`,
        type: 'free-recall',
        prompt: `Расскажите своими словами: ${topic.originalText}`,
        modelAnswer: topic.shortAnswer,
        checklist: topic.keyPoints.map((point) => point.title),
      },
      sourceTitles: topic.sources.map((source) => source.title),
    };
    return [...authored, ...term, ...ordering, matching, recall];
  });
}

function shuffled<T>(items: T[], random: () => number): T[] {
  return [...items]
    .map((item) => ({ item, order: random() }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item);
}

function shuffleQuestion(question: QuizQuestion, random: () => number): QuizQuestion {
  if (question.type === 'single-choice' || question.type === 'multiple-choice') {
    return { ...question, options: shuffled(question.options, random) };
  }
  if (question.type === 'matching') return { ...question, right: shuffled(question.right, random) };
  if (question.type === 'ordering') return { ...question, items: shuffled(question.items, random) };
  return question;
}

const statusWeight: Record<TopicStatus, number> = {
  'needs-review': 5,
  'not-started': 3,
  studying: 2,
  'can-answer': 1,
  mastered: 0.5,
};

export function selectPracticeQuestions({
  bank,
  count,
  section,
  kind,
  statuses = new Map(),
  recentQuestionIds = [],
  random = Math.random,
}: {
  bank: QuestionBankItem[];
  count: number;
  section?: TopicSection;
  kind?: QuestionBankItem['kind'];
  statuses?: Map<string, TopicStatus>;
  recentQuestionIds?: string[];
  random?: () => number;
}): QuestionBankItem[] {
  const scoped = bank.filter(
    (item) => (!section || item.section === section) && (!kind || item.kind === kind),
  );
  const recent = new Set(recentQuestionIds);
  const fresh = scoped.filter((item) => !recent.has(item.id));
  const pool = fresh.length >= count ? fresh : scoped;
  const ranked = pool
    .map((item) => ({
      item,
      rank: random() ** (1 / statusWeight[statuses.get(item.topicId) ?? 'not-started']),
    }))
    .sort((left, right) => right.rank - left.rank);
  const selected: QuestionBankItem[] = [];
  const fingerprint = (item: QuestionBankItem) =>
    item.question.prompt.toLocaleLowerCase('ru').replace(/\s+/g, ' ').trim();
  const addMatching = (accept: (item: QuestionBankItem) => boolean) => {
    for (const candidate of ranked) {
      if (selected.length >= count) break;
      if (!selected.includes(candidate.item) && accept(candidate.item)) selected.push(candidate.item);
    }
  };
  const hasTopic = (item: QuestionBankItem) =>
    selected.some((selectedItem) => selectedItem.topicId === item.topicId);
  const hasType = (item: QuestionBankItem) =>
    selected.some((selectedItem) => selectedItem.question.type === item.question.type);
  const hasFingerprint = (item: QuestionBankItem) =>
    selected.some((selectedItem) => fingerprint(selectedItem) === fingerprint(item));

  addMatching((item) => !hasTopic(item) && !hasType(item) && !hasFingerprint(item));
  addMatching((item) => !hasTopic(item) && !hasFingerprint(item));
  addMatching((item) => !hasType(item) && !hasFingerprint(item));
  addMatching((item) => !hasFingerprint(item));
  return selected.map((item) => ({
    ...item,
    question:
      item.question.type === 'free-recall' ? item.question : shuffleQuestion(item.question, random),
  }));
}
