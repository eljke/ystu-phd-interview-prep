import { describe, expect, it } from 'vitest';
import { readPracticeTopicIds } from './practiceScope';

describe('readPracticeTopicIds', () => {
  it('supports one topic and a selected topic set', () => {
    expect([...readPracticeTopicIds(new URLSearchParams('topic=1.1'))]).toEqual(['1.1']);
    expect([...readPracticeTopicIds(new URLSearchParams('topics=1.1,2.3,3.4'))]).toEqual([
      '1.1',
      '2.3',
      '3.4',
    ]);
  });
});
