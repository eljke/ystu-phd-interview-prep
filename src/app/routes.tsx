import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { AboutPage } from '../pages/AboutPage';
import { BackupPage } from '../pages/BackupPage';
import { ContentAuditPage } from '../pages/ContentAuditPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PracticePage } from '../pages/PracticePage';
import { PairSessionPage } from '../pages/PairSessionPage';
import { ProgressPage } from '../pages/ProgressPage';
import { QuizPage } from '../pages/QuizPage';
import { TopicPage } from '../pages/TopicPage';
import { TopicsPage } from '../pages/TopicsPage';
import { AccessAdminPage } from '../features/admin/AccessAdminPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="topics/:topicId" element={<TopicPage />} />
        <Route path="quiz/:topicId" element={<QuizPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="pair" element={<PairSessionPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="admin/access" element={<AccessAdminPage />} />
        <Route path="content-audit" element={<ContentAuditPage />} />
      </Route>
    </Routes>
  );
}
