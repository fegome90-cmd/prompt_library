import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptEditor } from '@/components/prompt-manager/prompt-editor';

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/store', () => ({
  useStore: () => ({
    categories: [{ id: 'cat-1', name: 'General' }],
    currentUser: null,
  }),
}));

describe('Prompt creation auth UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'No autorizado' }),
    }) as unknown as typeof fetch;
  });

  it('shows auth message and keeps modal open when save returns 401', async () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const prompt = {
      id: 'prompt-1',
      title: 'Prompt existente',
      description: 'Descripcion',
      body: 'Contenido',
      category: { id: 'cat-1', name: 'General' },
      tags: '[]',
      variablesSchema: '[]',
      outputFormat: '',
      riskLevel: 'low' as const,
      version: 1,
    };

    render(
      <PromptEditor
        prompt={prompt as never}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Debes iniciar sesión para crear o editar prompts');
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('blocks save before network call when there is no current user', async () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const prompt = {
      id: 'prompt-2',
      title: 'Prompt sin auth',
      description: 'Descripcion',
      body: 'Contenido',
      category: { id: 'cat-1', name: 'General' },
      tags: '[]',
      variablesSchema: '[]',
      outputFormat: '',
      riskLevel: 'low' as const,
      version: 1,
    };

    render(
      <PromptEditor
        prompt={prompt as never}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Debes iniciar sesión para crear o editar prompts');
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
