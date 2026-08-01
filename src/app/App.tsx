import { HashRouter } from 'react-router-dom';
import type { StudyRepository } from '../repositories/StudyRepository';
import type { AuthGateway } from '../services/auth/AuthGateway';
import { ProfileSetup } from '../features/profiles/ProfileSetup';
import { UpdatePrompt } from '../features/pwa/UpdatePrompt';
import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import { useProfiles } from './providers/ProfileProvider';
import { AppRoutes } from './routes';

function Application() {
  const { profiles } = useProfiles();
  return (
    <>
      {profiles.length > 0 ? <AppRoutes /> : <ProfileSetup />}
      <UpdatePrompt />
    </>
  );
}
export function App({
  repository,
  authGateway,
}: {
  repository?: StudyRepository;
  authGateway?: AuthGateway | null | undefined;
}) {
  const content = (
    <HashRouter>
      <Application />
    </HashRouter>
  );
  return (
    <ErrorBoundary>
      {repository ? (
        <AppProviders repository={repository} authGateway={authGateway}>
          {content}
        </AppProviders>
      ) : (
        <AppProviders authGateway={authGateway}>{content}</AppProviders>
      )}
    </ErrorBoundary>
  );
}
