import { describe, expect, it } from 'vitest';
import { topicSchema } from './topicSchema';

const validTopic = {
  id: 'topic-1-1', code: '1.1', section: 'mathematical-modeling', originalText: 'Определение модели.',
  shortAnswer: 'Модель — упрощённое представление объекта.', extendedAnswer: 'Модель сохраняет существенные свойства объекта для выбранной цели.',
  keyPoints: [{ id: 'definition', title: 'Определение', explanation: 'Упрощённое представление.' }, { id: 'purpose', title: 'Назначение', explanation: 'Исследование свойств.' }],
  formulas: [], example: 'Макет здания.', commonMistakes: ['Не путать модель и объект.'],
  oralChecklist: [{ id: 'definition', label: 'Дано определение', critical: true }, { id: 'example', label: 'Есть пример', critical: false }],
  quiz: [{ id: 'q1', type: 'single-choice', prompt: 'Что такое модель?', explanation: 'Модель заменяет объект для цели исследования.', keyPointIds: ['definition'], options: [{ id: 'a', text: 'Копия без упрощений' }, { id: 'b', text: 'Целевое представление' }], correctOptionId: 'b' }],
  sources: [{ title: 'Источник 1', url: 'https://example.com/1', supports: ['definition'] }, { title: 'Источник 2', url: 'https://example.com/2', supports: ['shortAnswer'] }],
} as const;

describe('topicSchema', () => {
  it('accepts complete topic content', () => expect(topicSchema.parse(validTopic).code).toBe('1.1'));
  it('rejects an empty short answer', () => expect(() => topicSchema.parse({ ...validTopic, shortAnswer: '' })).toThrow());
  it('rejects missing quiz questions', () => expect(() => topicSchema.parse({ ...validTopic, quiz: [] })).toThrow());
  it('rejects fewer than two sources', () => expect(() => topicSchema.parse({ ...validTopic, sources: validTopic.sources.slice(0, 1) })).toThrow());
  it('rejects unknown key-point references', () => expect(() => topicSchema.parse({ ...validTopic, quiz: [{ ...validTopic.quiz[0], keyPointIds: ['missing'] }] })).toThrow());
  it('rejects a source with any unknown content reference', () => expect(() => topicSchema.parse({ ...validTopic, sources: [{ ...validTopic.sources[0], supports: ['shortAnswer', 'missing'] }, validTopic.sources[1]] })).toThrow());
});
