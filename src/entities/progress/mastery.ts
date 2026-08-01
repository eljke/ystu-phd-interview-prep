import type { TopicStatus, TopicProgress, QuizAttempt, OralAttempt, PartnerAssessment } from './progress';

export const MASTERY_WEIGHTS = {
  coverage: 0.2,
  quizAccuracy: 0.25,
  selfConfidence: 0.15,
  oralScore: 0.25,
  partnerScore: 0.15,
} as const;

export interface MasteryInput {
  progress: TopicProgress | undefined;
  quizAttempts: QuizAttempt[];
  oralAttempts: OralAttempt[];
  partnerAssessments: PartnerAssessment[];
  criticalCriterionIds: string[];
  now: string;
}

export interface MasteryResult {
  score: number;
  status: TopicStatus;
  coverage: number;
  quizAccuracy: number;
  selfConfidence: number;
  oralScore: number;
  partnerScore?: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const mean = (values: number[]) => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
const datePart = (iso: string) => iso.slice(0, 10);

export function calculateMastery(input: MasteryInput): MasteryResult {
  const coverage = clamp((input.progress?.viewedSections.length ?? 0) / 6);
  const quizAccuracy = clamp(mean(input.quizAttempts.slice(-3).map((attempt) => attempt.score)));
  const selfConfidence = clamp(mean(input.oralAttempts.slice(-3).map((attempt) => attempt.selfConfidence)));
  const oralScore = clamp(mean(input.oralAttempts.slice(-3).map((attempt) => attempt.oralScore)));
  const partnerValues = input.partnerAssessments.slice(-3).map((assessment) => assessment.score);
  const partnerScore = partnerValues.length > 0 ? clamp(mean(partnerValues)) : undefined;

  const components = { coverage, quizAccuracy, selfConfidence, oralScore };
  let score: number;
  if (partnerScore === undefined) {
    const total = MASTERY_WEIGHTS.coverage + MASTERY_WEIGHTS.quizAccuracy + MASTERY_WEIGHTS.selfConfidence + MASTERY_WEIGHTS.oralScore;
    score = (
      coverage * MASTERY_WEIGHTS.coverage +
      quizAccuracy * MASTERY_WEIGHTS.quizAccuracy +
      selfConfidence * MASTERY_WEIGHTS.selfConfidence +
      oralScore * MASTERY_WEIGHTS.oralScore
    ) / total;
  } else {
    score = components.coverage * MASTERY_WEIGHTS.coverage + components.quizAccuracy * MASTERY_WEIGHTS.quizAccuracy + components.selfConfidence * MASTERY_WEIGHTS.selfConfidence + components.oralScore * MASTERY_WEIGHTS.oralScore + partnerScore * MASTERY_WEIGHTS.partnerScore;
  }
  score = clamp(score);

  const latestAssessedAttempt = [...input.oralAttempts, ...input.partnerAssessments].sort((left, right) =>
    left.completedAt.localeCompare(right.completedAt),
  ).at(-1);
  const failedCritical = latestAssessedAttempt?.criteria.some(
    (criterion) =>
      input.criticalCriterionIds.includes(criterion.criterionId) && criterion.result === 'missed',
  ) ?? false;
  const latestQuizScore = input.quizAttempts.at(-1)?.score;
  const latestOralScore = input.oralAttempts.at(-1)?.oralScore;
  const weakLatest =
    (latestQuizScore !== undefined && latestQuizScore < 0.5) ||
    (latestOralScore !== undefined && latestOralScore < 0.5);
  const successfulDates = new Set([
    ...input.quizAttempts.filter((attempt) => attempt.score >= 0.7).map((attempt) => datePart(attempt.completedAt)),
    ...input.oralAttempts.filter((attempt) => attempt.oralScore >= 0.7).map((attempt) => datePart(attempt.completedAt)),
  ]);

  let status: TopicStatus = 'not-started';
  if (coverage > 0 || input.quizAttempts.length > 0 || input.oralAttempts.length > 0) status = 'studying';
  const canAnswer = coverage >= 0.67 && input.quizAttempts.length > 0 && input.oralAttempts.length > 0 && !failedCritical && quizAccuracy >= 0.6 && oralScore >= 0.6;
  if (canAnswer) status = successfulDates.size >= 2 && score >= 0.72 ? 'mastered' : 'can-answer';
  if (input.progress?.manualReview || weakLatest) status = 'needs-review';

  return { score, status, coverage, quizAccuracy, selfConfidence, oralScore, ...(partnerScore === undefined ? {} : { partnerScore }) };
}
