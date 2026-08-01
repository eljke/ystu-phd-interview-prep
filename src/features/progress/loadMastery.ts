import type { Topic } from '../../entities/content/topic';
import { calculateMastery, type MasteryResult } from '../../entities/progress/mastery';
import type { StudyRepository } from '../../repositories/StudyRepository';

export async function loadMasteryMap(repository: StudyRepository, profileId: string, topics: readonly Topic[]): Promise<Map<string, MasteryResult>> {
  const [progress, quizzes, oral, assessments] = await Promise.all([
    repository.listTopicProgress(profileId),
    repository.listQuizAttempts(profileId),
    repository.listOralAttempts(profileId),
    repository.listPartnerAssessments(profileId),
  ]);
  const map = new Map<string, MasteryResult>();
  const now = new Date().toISOString();
  for (const topic of topics) {
    map.set(topic.id, calculateMastery({
      progress: progress.find((item)=>item.topicId===topic.id),
      quizAttempts: quizzes.filter((item)=>item.topicId===topic.id),
      oralAttempts: oral.filter((item)=>item.topicId===topic.id),
      partnerAssessments: assessments.filter((item)=>item.topicId===topic.id),
      criticalCriterionIds: topic.oralChecklist.filter((item)=>item.critical).map((item)=>item.id),
      now,
    }));
  }
  return map;
}
