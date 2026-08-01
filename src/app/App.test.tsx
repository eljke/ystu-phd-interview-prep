import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AuthGateway } from '../services/auth/AuthGateway';
import { MemoryStudyRepository } from '../storage/memory/MemoryStudyRepository';
import { App } from './App';

const authenticatedGateway: AuthGateway = {
  getSession: vi.fn().mockResolvedValue({ userId: 'github-user', githubLogin: 'eljke' }),
  checkAccess: vi.fn().mockResolvedValue({ status: 'allowed', role: 'member' }),
  signInWithGitHub: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
};

describe('App', () => {
  it('explains the purpose on first launch', async () => {
    render(<App repository={new MemoryStudyRepository()} />);
    expect(await screen.findByRole('heading', { name: 'Готовьтесь вдвоём, отвечайте уверенно' })).toBeInTheDocument();
    expect(screen.getByText(/Все 43 темы доступны сразу/)).toBeInTheDocument();
  });

  it('uses the GitHub identity without a profile selector in cloud mode', async () => {
    const repository = new MemoryStudyRepository();
    const now = new Date().toISOString();
    await repository.saveProfile({ id: 'github-user', name: 'Коля', createdAt: now, updatedAt: now });
    await repository.saveProfile({ id: 'local-user', name: 'Илья', createdAt: now, updatedAt: now });

    render(<App repository={repository} authGateway={authenticatedGateway} />);

    expect(await screen.findByText('@eljke')).toBeInTheDocument();
    expect(screen.queryByText('Активный участник')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Активный участник' })).not.toBeInTheDocument();
  });
});
