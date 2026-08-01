import type { TopicStatus } from '../../entities/progress/progress';
export const STATUS_LABELS: Record<TopicStatus,string>={
  'not-started':'Не начата','studying':'Изучаю','can-answer':'Могу ответить','mastered':'Закреплена','needs-review':'Нужно повторить'
};
