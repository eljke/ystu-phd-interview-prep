import {
  type QuizQuestion,
  type SingleChoiceQuestion,
  type Topic,
  type TopicSection,
} from '../../entities/content/topic';
import type { TopicStatus } from '../../entities/progress/progress';

export interface QuestionBankItem {
  id: string;
  topicId: string;
  topicCode: string;
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

function rotate<T>(items: T[], offset: number): T[] {
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function buildQuestionBank(topics: readonly Topic[]): QuestionBankItem[] {
  const bySection = new Map<
    TopicSection,
    Array<{ topic: Topic; title: string; explanation: string }>
  >();
  for (const topic of topics) {
    const entries = bySection.get(topic.section) ?? [];
    entries.push(...topic.keyPoints.map((point) => ({ topic, ...point })));
    bySection.set(topic.section, entries);
  }

  return topics.flatMap((topic) => {
    const authored = topic.quiz.map((question) => ({
      id: `${topic.id}:${question.id}`,
      topicId: topic.id,
      topicCode: topic.code,
      section: topic.section,
      kind: 'objective' as const,
      question: { ...question, id: `${topic.id}:${question.id}` },
      sourceTitles: topic.sources.map((source) => source.title),
    }));
    const sectionPoints = bySection.get(topic.section) ?? [];
    const generated = topic.keyPoints.map((point, index): QuestionBankItem => {
      const distractors = rotate(sectionPoints, index + 1)
        .filter((candidate) => candidate.topic.id !== topic.id || candidate.title !== point.title)
        .slice(0, 3);
      const questionId = `${topic.id}:concept:${point.id}`;
      const question: SingleChoiceQuestion = {
        id: questionId,
        type: 'single-choice',
        prompt: `Как проще всего объяснить «${point.title}»?`,
        explanation: point.explanation,
        keyPointIds: [point.id],
        options: [
          { id: `${questionId}:correct`, text: point.explanation },
          ...distractors.map((candidate, optionIndex) => ({
            id: `${questionId}:d${optionIndex + 1}`,
            text: candidate.explanation,
          })),
        ],
        correctOptionId: `${questionId}:correct`,
      };
      return {
        id: questionId,
        topicId: topic.id,
        topicCode: topic.code,
        section: topic.section,
        kind: 'objective',
        question,
        sourceTitles: topic.sources.map((source) => source.title),
      };
    });
    const selectedPoints = topic.keyPoints.slice(0, 3);
    const foreignPoints = sectionPoints
      .filter((candidate) => candidate.topic.id !== topic.id)
      .slice(0, 3);
    const multipleId = `${topic.id}:key-points`;
    const multiple: QuestionBankItem = {
      id: multipleId,
      topicId: topic.id,
      topicCode: topic.code,
      section: topic.section,
      kind: 'objective',
      question: {
        id: multipleId,
        type: 'multiple-choice',
        prompt: `Какие тезисы действительно относятся к теме ${topic.code}?`,
        explanation: `Главные тезисы: ${selectedPoints.map((point) => point.title).join(', ')}.`,
        keyPointIds: selectedPoints.map((point) => point.id),
        options: [
          ...selectedPoints.map((point) => ({
            id: `${multipleId}:${point.id}`,
            text: point.explanation,
          })),
          ...foreignPoints.map((point, index) => ({
            id: `${multipleId}:d${index + 1}`,
            text: point.explanation,
          })),
        ],
        correctOptionIds: selectedPoints.map((point) => `${multipleId}:${point.id}`),
      },
      sourceTitles: topic.sources.map((source) => source.title),
    };
    const matchingId = `${topic.id}:matching`;
    const matching: QuestionBankItem = {
      id: matchingId,
      topicId: topic.id,
      topicCode: topic.code,
      section: topic.section,
      kind: 'objective',
      question: {
        id: matchingId,
        type: 'matching',
        prompt: 'Соотнесите понятие и его простой смысл.',
        explanation: 'Если связи понятны, тему проще объяснить без заученного текста.',
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
      section: topic.section,
      kind: 'free-recall',
      question: {
        id: `${topic.id}:recall`,
        type: 'free-recall',
        prompt: `Объясните простыми словами: ${topic.originalText}`,
        modelAnswer: topic.shortAnswer,
        checklist: topic.oralChecklist.map((item) => item.label),
      },
      sourceTitles: topic.sources.map((source) => source.title),
    };
    return [...authored, ...generated, multiple, matching, recall];
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
  for (const candidate of ranked) {
    if (selected.length >= count) break;
    if (selected.some((item) => item.topicId === candidate.item.topicId)) continue;
    selected.push(candidate.item);
  }
  for (const candidate of ranked) {
    if (selected.length >= count) break;
    if (!selected.includes(candidate.item)) selected.push(candidate.item);
  }
  return selected.map((item) => ({
    ...item,
    question:
      item.question.type === 'free-recall' ? item.question : shuffleQuestion(item.question, random),
  }));
}
