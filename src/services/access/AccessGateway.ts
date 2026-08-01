export interface AccessEntry {
  githubUserId: number;
  githubLogin: string;
  role: 'member' | 'admin';
  active: boolean;
}

export type AccessMutation =
  | { action: 'grant'; githubLogin: string; role: 'member' | 'admin' }
  | { action: 'revoke'; githubLogin: string }
  | { action: 'set-role'; githubLogin: string; role: 'member' | 'admin' };

export interface AccessGateway {
  list(): Promise<AccessEntry[]>;
  mutate(command: AccessMutation): Promise<void>;
}
