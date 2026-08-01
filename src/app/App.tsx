import { HashRouter } from 'react-router-dom';
import type { StudyRepository } from '../repositories/StudyRepository';
import { ProfileSetup } from '../features/profiles/ProfileSetup';
import { UpdatePrompt } from '../features/pwa/UpdatePrompt';
import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import { useProfiles } from './providers/ProfileProvider';
import { AppRoutes } from './routes';

function Application(){const{profiles}=useProfiles();return <>{profiles.length===2?<AppRoutes/>:<ProfileSetup/>}<UpdatePrompt/></>}
export function App({repository}:{repository?:StudyRepository}){const content=<HashRouter><Application/></HashRouter>;return <ErrorBoundary>{repository?<AppProviders repository={repository}>{content}</AppProviders>:<AppProviders>{content}</AppProviders>}</ErrorBoundary>}
