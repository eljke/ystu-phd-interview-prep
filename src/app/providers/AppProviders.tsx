import type { ReactNode } from 'react';
import type { StudyRepository } from '../../repositories/StudyRepository';
import { ProfileProvider } from './ProfileProvider';
import { RepositoryProvider } from './RepositoryProvider';
import { ThemeProvider } from './ThemeProvider';
function Inner({children}:{children:ReactNode}){return <ProfileProvider><ThemeProvider>{children}</ThemeProvider></ProfileProvider>}
export function AppProviders({children,repository}:{children:ReactNode;repository?:StudyRepository}){return repository?<RepositoryProvider repository={repository}><Inner>{children}</Inner></RepositoryProvider>:<RepositoryProvider><Inner>{children}</Inner></RepositoryProvider>}
