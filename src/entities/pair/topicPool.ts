export type PairTopicMode = 'all' | 'responder-weak' | 'pair-weak' | 'mock-interview';

interface Identified {
  id: string;
}

type ScoreValue = number | { score: number };

const scoreOf = (scores: ReadonlyMap<string, ScoreValue>, id: string) => {
  const value = scores.get(id);
  return typeof value === 'number' ? value : value?.score ?? 0;
};

export function createPairTopicPool<T extends Identified>(
  topics: readonly T[],
  mode: PairTopicMode,
  responderScores: ReadonlyMap<string, ScoreValue>,
  reviewerScores: ReadonlyMap<string, ScoreValue>,
): T[] {
  if (mode === 'all' || mode === 'mock-interview') return [...topics];

  return [...topics].sort((left, right) => {
    const leftScore =
      mode === 'responder-weak'
        ? scoreOf(responderScores, left.id)
        : Math.min(scoreOf(responderScores, left.id), scoreOf(reviewerScores, left.id));
    const rightScore =
      mode === 'responder-weak'
        ? scoreOf(responderScores, right.id)
        : Math.min(scoreOf(responderScores, right.id), scoreOf(reviewerScores, right.id));
    return leftScore - rightScore;
  });
}

export function sampleWithoutReplacement<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const copy = [...items];
  const result: T[] = [];
  const target = Math.min(Math.max(0, count), copy.length);
  while (result.length < target) {
    const index = Math.min(copy.length - 1, Math.floor(random() * copy.length));
    const [item] = copy.splice(index, 1);
    if (item !== undefined) result.push(item);
  }
  return result;
}
