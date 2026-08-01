import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryStudyRepository } from '../storage/memory/MemoryStudyRepository';
import { App } from './App';

describe('App', () => {
  it('explains the purpose on first launch', async () => {
    render(<App repository={new MemoryStudyRepository()} />);
    expect(await screen.findByRole('heading', { name: 'Готовьтесь вдвоём, отвечайте уверенно' })).toBeInTheDocument();
    expect(screen.getByText(/Все 43 темы доступны сразу/)).toBeInTheDocument();
  });
});
