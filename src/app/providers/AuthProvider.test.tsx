import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccessDecision, AuthGateway, AuthSession } from '../../services/auth/AuthGateway';
import { AuthProvider, useAuth } from './AuthProvider';

function Consumer() {
  const { role, cloudEnabled } = useAuth();
  return (
    <p>
      content:{role ?? 'none'}:{String(cloudEnabled)}
    </p>
  );
}

function gateway(session: AuthSession | null, decision: AccessDecision): AuthGateway {
  return {
    getSession: vi.fn().mockResolvedValue(session),
    checkAccess: vi.fn().mockResolvedValue(decision),
    signInWithGitHub: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

describe('AuthProvider', () => {
  it('keeps local development available when cloud is unconfigured', () => {
    render(
      <AuthProvider gateway={null}>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByText('content:none:false')).toBeInTheDocument();
  });

  it('fails closed in production when cloud is unconfigured', () => {
    const view = render(
      <AuthProvider gateway={null} allowLocalAccess={false}>
        <Consumer />
      </AuthProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Облачный вход ещё не настроен' }),
    ).toBeInTheDocument();
    expect(view.container).not.toHaveTextContent('content:none:false');
  });

  it('asks an unauthenticated user to sign in through GitHub', async () => {
    render(
      <AuthProvider gateway={gateway(null, { status: 'denied', message: '' })}>
        <Consumer />
      </AuthProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Войдите через GitHub' }),
    ).toBeInTheDocument();
  });

  it('rejects a GitHub user outside the whitelist', async () => {
    const denied = gateway(
      { userId: 'user-1', githubLogin: 'outsider' },
      { status: 'denied', message: 'Нет доступа' },
    );
    render(
      <AuthProvider gateway={denied}>
        <Consumer />
      </AuthProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Аккаунт не входит в whitelist' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Нет доступа')).toBeInTheDocument();
    await waitFor(() => expect(denied.signOut).toHaveBeenCalledOnce());
  });

  it('exposes an admitted administrator to the application', async () => {
    render(
      <AuthProvider
        gateway={gateway(
          { userId: 'admin-1', githubLogin: 'admin' },
          { status: 'allowed', role: 'admin' },
        )}
      >
        <Consumer />
      </AuthProvider>,
    );
    expect(await screen.findByText('content:admin:true')).toBeInTheDocument();
  });
});
