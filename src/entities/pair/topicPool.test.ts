import { describe, expect, it } from 'vitest';
import { createPairTopicPool, sampleWithoutReplacement } from './topicPool';

const topics = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('createPairTopicPool', () => {
  it('prioritises the responder weak topics', () => {
    const result = createPairTopicPool(topics, 'responder-weak', new Map([['a', 0.8], ['b', 0.1], ['c', 0.4]]), new Map());
    expect(result.map((topic) => topic.id)).toEqual(['b', 'c', 'a']);
  });

  it('uses the weaker participant score for pair weak topics', () => {
    const result = createPairTopicPool(
      topics,
      'pair-weak',
      new Map([['a', 0.9], ['b', 0.5], ['c', 0.4]]),
      new Map([['a', 0.2], ['b', 0.6], ['c', 0.7]]),
    );
    expect(result.map((topic) => topic.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('sampleWithoutReplacement', () => {
  it('never repeats a topic', () => {
    const result = sampleWithoutReplacement(topics, 3, () => 0);
    expect(new Set(result.map((topic) => topic.id)).size).toBe(3);
  });
});
