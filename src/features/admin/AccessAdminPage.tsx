import { ShieldCheck, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import type { AccessEntry, AccessGateway } from '../../services/access/AccessGateway';
import { SupabaseAccessGateway } from '../../services/access/SupabaseAccessGateway';
import { getSupabaseClient } from '../../services/supabase/client';
import { Button } from '../../shared/ui/Button';

export function AccessAdminPage({ gateway: provided }: { gateway?: AccessGateway }) {
  const { role } = useAuth();
  const gateway = useMemo(() => {
    if (provided) return provided;
    const client = getSupabaseClient();
    return client ? new SupabaseAccessGateway(client) : null;
  }, [provided]);
  const [entries, setEntries] = useState<AccessEntry[]>([]);
  const [login, setLogin] = useState('');
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!gateway) return;
    try {
      setEntries(await gateway.list());
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось загрузить whitelist.');
    }
  }, [gateway]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (role !== 'admin')
    return (
      <main>
        <h1>Доступ запрещён</h1>
      </main>
    );
  if (!gateway)
    return (
      <main>
        <h1>Облако не настроено</h1>
      </main>
    );

  const grant = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      await gateway.mutate({ action: 'grant', githubLogin: login.trim(), role: newRole });
      setLogin('');
      await refresh();
      setMessage('Доступ обновлён.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось обновить whitelist.');
    }
  };
  const mutate = async (entry: AccessEntry, action: 'revoke' | 'set-role') => {
    const command =
      action === 'revoke'
        ? ({ action, githubLogin: entry.githubLogin } as const)
        : ({
            action,
            githubLogin: entry.githubLogin,
            role: entry.role === 'admin' ? 'member' : 'admin',
          } as const);
    setMessage('');
    try {
      await gateway.mutate(command);
      await refresh();
      setMessage('Доступ обновлён.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Не удалось обновить whitelist.');
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Администрирование</p>
          <h1>Доступ по GitHub</h1>
          <p>OAuth-вход работает только для активных аккаунтов из whitelist.</p>
        </div>
      </header>
      <form className="info-card" onSubmit={(event) => void grant(event)}>
        <label className="field">
          <span className="field__label">GitHub login</span>
          <input
            required
            pattern="[A-Za-z0-9-]{1,39}"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Роль</span>
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value as 'member' | 'admin')}
          >
            <option value="member">Участник</option>
            <option value="admin">Администратор</option>
          </select>
        </label>
        <Button type="submit">
          <UserPlus size={17} /> Добавить
        </Button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <section className="section-block">
        <h2>Whitelist</h2>
        <div className="topic-grid">
          {entries.map((entry) => (
            <article key={entry.githubUserId} className="info-card">
              <ShieldCheck />
              <h3>@{entry.githubLogin}</h3>
              <p>
                {entry.role === 'admin' ? 'Администратор' : 'Участник'} ·{' '}
                {entry.active ? 'доступ активен' : 'доступ отозван'}
              </p>
              <div className="button-row">
                <Button variant="secondary" onClick={() => void mutate(entry, 'set-role')}>
                  Сменить роль
                </Button>
                {entry.active && (
                  <Button variant="danger" onClick={() => void mutate(entry, 'revoke')}>
                    Отозвать
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
