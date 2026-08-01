import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../app/providers/AuthProvider';
import type { AccessGateway } from '../../services/access/AccessGateway';
import type { AuthGateway } from '../../services/auth/AuthGateway';
import { AccessAdminPage } from './AccessAdminPage';

describe('AccessAdminPage', () => {
  it('lists allowed users and grants access by GitHub login', async () => {
    const authGateway: AuthGateway = {
      getSession: vi.fn().mockResolvedValue({ userId: 'admin-1', githubLogin: 'owner' }),
      checkAccess: vi.fn().mockResolvedValue({ status: 'allowed', role: 'admin' }),
      signInWithGitHub: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    const accessGateway: AccessGateway = {
      list: vi
        .fn()
        .mockResolvedValue([
          { githubUserId: 1, githubLogin: 'owner', role: 'admin', active: true },
        ]),
      mutate: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <AuthProvider gateway={authGateway}>
        <AccessAdminPage gateway={accessGateway} />
      </AuthProvider>,
    );

    expect(await screen.findByText('@owner')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'GitHub login' }), 'new-user');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(accessGateway.mutate).toHaveBeenCalledWith({
      action: 'grant',
      githubLogin: 'new-user',
      role: 'member',
    });
    expect(await screen.findByText('Доступ обновлён.')).toBeInTheDocument();
  });
});
