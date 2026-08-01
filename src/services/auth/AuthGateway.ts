export interface AuthSession {
  userId: string;
  githubLogin: string;
}

export type AccessDecision =
  { status: 'allowed'; role: 'member' | 'admin' } | { status: 'denied'; message: string };

export interface AuthGateway {
  getSession(): Promise<AuthSession | null>;
  signInWithGitHub(redirectTo: string): Promise<void>;
  signOut(): Promise<void>;
  checkAccess(): Promise<AccessDecision>;
}
