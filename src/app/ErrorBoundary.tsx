import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../shared/ui/Button';

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  override render() {
    if (this.state.error) {
      return (
        <main className="center-screen">
          <section className="dialog">
            <h1>Не удалось открыть раздел</h1>
            <p>{this.state.error.message}</p>
            <Button onClick={() => window.location.reload()}>Перезагрузить приложение</Button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
