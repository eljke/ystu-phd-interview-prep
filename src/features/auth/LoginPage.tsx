import { Github } from 'lucide-react';
import { useState } from 'react';
import type { AuthGateway } from '../../services/auth/AuthGateway';
import { Button } from '../../shared/ui/Button';

export function LoginPage({ gateway }: { gateway: AuthGateway }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    setError('');
    try {
      await gateway.signInWithGitHub(`${window.location.origin}${import.meta.env.BASE_URL}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти через GitHub.');
      setBusy(false);
    }
  };
  return (
    <main className="onboarding">
      <section className="onboarding__panel">
        <div className="brand-mark">
          <Github size={28} />
        </div>
        <p className="eyebrow">YSTU · закрытый доступ</p>
        <h1>Войдите через GitHub</h1>
        <p className="lead">Приложением могут пользоваться только аккаунты из списка доступа.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button disabled={busy} onClick={() => void signIn()}>
          <Github size={18} /> {busy ? 'Перенаправляем…' : 'Войти через GitHub'}
        </Button>
      </section>
    </main>
  );
}
