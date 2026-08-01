import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const option = z.object({ id: nonEmpty, text: nonEmpty });
const base = {
  id: nonEmpty,
  prompt: nonEmpty,
  explanation: nonEmpty,
  keyPointIds: z.array(nonEmpty).min(1),
};

const singleChoice = z.object({
  ...base,
  type: z.literal('single-choice'),
  options: z.array(option).min(2),
  correctOptionId: nonEmpty,
});
const multipleChoice = z.object({
  ...base,
  type: z.literal('multiple-choice'),
  options: z.array(option).min(2),
  correctOptionIds: z.array(nonEmpty).min(1),
});
const matching = z.object({
  ...base,
  type: z.literal('matching'),
  left: z.array(option).min(2),
  right: z.array(option).min(2),
  pairs: z.record(z.string(), z.string()),
});
const ordering = z.object({
  ...base,
  type: z.literal('ordering'),
  items: z.array(option).min(2),
  correctOrder: z.array(nonEmpty).min(2),
});
const fillBlank = z.object({
  ...base,
  type: z.literal('fill-blank'),
  acceptedAnswers: z.array(nonEmpty).min(1),
  caseSensitive: z.boolean(),
});

export const quizQuestionSchema = z.discriminatedUnion('type', [
  singleChoice,
  multipleChoice,
  matching,
  ordering,
  fillBlank,
]);

export const topicSchema = z
  .object({
    id: nonEmpty,
    code: z.string().regex(/^[123]\.\d{1,2}$/),
    section: z.enum(['mathematical-modeling', 'numerical-methods', 'software-complexes']),
    originalText: nonEmpty,
    shortAnswer: nonEmpty,
    extendedAnswer: nonEmpty,
    keyPoints: z.array(z.object({ id: nonEmpty, title: nonEmpty, explanation: nonEmpty })).min(2),
    formulas: z.array(
      z.object({ id: nonEmpty, latex: nonEmpty, plainText: nonEmpty, explanation: nonEmpty }),
    ),
    example: nonEmpty.optional(),
    commonMistakes: z.array(nonEmpty).min(1),
    oralChecklist: z.array(z.object({ id: nonEmpty, label: nonEmpty, critical: z.boolean() })).min(2),
    quiz: z.array(quizQuestionSchema).min(1),
    sources: z.array(z.object({ title: nonEmpty, url: z.string().url(), supports: z.array(nonEmpty).min(1) })).min(2).max(4),
    sourceNote: nonEmpty.optional(),
  })
  .superRefine((topic, ctx) => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    const keyIds = topic.keyPoints.map((item) => item.id);
    if (!unique(keyIds)) ctx.addIssue({ code: 'custom', message: 'Duplicate key point ids', path: ['keyPoints'] });
    const questionIds = topic.quiz.map((item) => item.id);
    if (!unique(questionIds)) ctx.addIssue({ code: 'custom', message: 'Duplicate quiz ids', path: ['quiz'] });
    for (const [index, question] of topic.quiz.entries()) {
      for (const keyPointId of question.keyPointIds) {
        if (!keyIds.includes(keyPointId)) ctx.addIssue({ code: 'custom', message: `Unknown key point ${keyPointId}`, path: ['quiz', index, 'keyPointIds'] });
      }
      if (question.type === 'single-choice' && !question.options.some((o) => o.id === question.correctOptionId)) {
        ctx.addIssue({ code: 'custom', message: 'Unknown correct option', path: ['quiz', index] });
      }
      if (question.type === 'multiple-choice') {
        const optionIds = question.options.map((o) => o.id);
        if (question.correctOptionIds.some((id) => !optionIds.includes(id))) ctx.addIssue({ code: 'custom', message: 'Unknown correct option', path: ['quiz', index] });
      }
    }
    const supported = new Set([...keyIds, 'shortAnswer', 'extendedAnswer', 'example', 'oralChecklist']);
    for (const [index, source] of topic.sources.entries()) {
      for (const [supportIndex, value] of source.supports.entries()) {
        if (!supported.has(value)) {
          ctx.addIssue({
            code: 'custom',
            message: `Source supports unknown content: ${value}`,
            path: ['sources', index, 'supports', supportIndex],
          });
        }
      }
    }
  });
