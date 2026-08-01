import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../app/App';
import { MemoryStudyRepository } from '../../storage/memory/MemoryStudyRepository';

describe('ProfileSetup', () => {
  it('creates two distinct profiles and opens navigation', async () => {
    const repository = new MemoryStudyRepository();
    render(<App repository={repository} />);
    const user = userEvent.setup();
    const inputs = await screen.findAllByPlaceholderText('Имя');
    await user.type(inputs[0]!, 'Анна');
    await user.type(inputs[1]!, 'Борис');
    await user.click(screen.getByRole('button', { name: 'Начать подготовку' }));
    expect(await screen.findByRole('navigation', { name: 'Основная навигация' })).toBeInTheDocument();
    expect(await repository.listProfiles()).toHaveLength(2);
  });
});
