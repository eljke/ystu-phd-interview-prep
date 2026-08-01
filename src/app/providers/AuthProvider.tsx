import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessDeniedPage } from '../../features/auth/AccessDeniedPage';
import { LoginPage } from '../../features/auth/LoginPage';
import type { AuthGateway, AuthSession } from '../../services/auth/AuthGateway';
import { SupabaseAuthGateway } from '../../services/auth/SupabaseAuthGateway';
import { getSupabaseClient } from '../../services/supabase/client';

interface AuthContextValue {
  session: AuthSession | null;
  role: 'member' | 'admin' | null;
  cloudEnabled: boolean;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  gateway: provided,
}: {
  children: ReactNode;
  gateway?: AuthGateway | null | undefined;
}) {
  const gateway = useMemo(() => {
    if (provided !== undefined) return provided;
    const client = getSupabaseClient();
    return client ? new SupabaseAuthGateway(client) : null;
  }, [provided]);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'allowed' | 'denied'>(
    gateway ? 'loading' : 'allowed',
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [role, setRole] = useState<'member' | 'admin' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!gateway) return;
    let active = true;
    void gateway
      .getSession()
      .then(async (current) => {
        if (!active) return;
        if (!current) {
          setStatus('unauthenticated');
          return;
        }
        const decision = await gateway.checkAccess();
        if (!active) return;
        if (decision.status === 'denied') {
          await gateway.signOut();
          setMessage(decision.message);
          setStatus('denied');
          return;
        }
        setSession(current);
        setRole(decision.role);
        setStatus('allowed');
        const postAuthHash = window.localStorage.getItem('ystu-post-auth-hash');
        if (postAuthHash) {
          window.localStorage.removeItem('ystu-post-auth-hash');
          window.location.hash = postAuthHash;
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setMessage(reason instanceof Error ? reason.message : 'Не удалось проверить доступ.');
        setStatus('denied');
      });
    return () => {
      active = false;
    };
  }, [gateway]);

  if (status === 'loading')
    return (
      <main className="center-screen">
        <div className="loader" />
        <p>Проверяем доступ…</p>
      </main>
    );
  if (gateway && status === 'unauthenticated') return <LoginPage gateway={gateway} />;
  if (status === 'denied') return <AccessDeniedPage message={message} />;

  const value: AuthContextValue = {
    session,
    role,
    cloudEnabled: Boolean(gateway),
    signOut: async () => {
      if (gateway) await gateway.signOut();
      setSession(null);
      setRole(null);
      setStatus(gateway ? 'unauthenticated' : 'allowed');
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
