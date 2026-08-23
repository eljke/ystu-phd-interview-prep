import type { ReactNode } from 'react';
import type { StudyRepository } from '../../repositories/StudyRepository';
import type { AuthGateway } from '../../services/auth/AuthGateway';
import { AuthProvider } from './AuthProvider';
import { ProfileProvider } from './ProfileProvider';
import { RepositoryProvider } from './RepositoryProvider';
import { ThemeProvider } from './ThemeProvider';
function Inner({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ProfileProvider>
  );
}
export function AppProviders({
  children,
  repository,
  authGateway,
}: {
  children: ReactNode;
  repository?: StudyRepository;
  authGateway?: AuthGateway | null | undefined;
}) {
  const content = repository ? (
    <RepositoryProvider repository={repository}>
      <Inner>{children}</Inner>
    </RepositoryProvider>
  ) : (
    <RepositoryProvider>
      <Inner>{children}</Inner>
    </RepositoryProvider>
  );
  return (
    <AuthProvider gateway={authGateway ?? null} allowLocalAccess>
      {content}
    </AuthProvider>
  );
}
