import { api } from './api';
import type { Note, Board, NoteType, NoteColor } from '@/types/note.types';

const unwrap = <T>(res: { data: unknown }, key: string): T => {
  const d = res.data as Record<string, unknown>;
  if (d?.data && typeof d.data === 'object' && key in (d.data as Record<string, unknown>))
    return (d.data as Record<string, unknown>)[key] as T;
  if (key in d) return d[key] as T;
  throw new Error(`API missing key "${key}". Got: ${JSON.stringify(d)}`);
};

export const boardApi = {
  createBoard:  async (name: string): Promise<Board> =>
    unwrap<Board>(await api.post('/boards', { name }), 'board'),

  getMyBoards:  async (): Promise<Board[]> =>
    unwrap<Board[]>(await api.get('/boards'), 'boards'),

  getBoard:     async (boardId: string): Promise<Board> =>
    unwrap<Board>(await api.get(`/boards/${boardId}`), 'board'),

  updateLock:   async (boardId: string, isLocked: boolean): Promise<Board> =>
    unwrap<Board>(await api.patch(`/boards/${boardId}/lock`, { isLocked }), 'board'),

  updateViewport: async (boardId: string, x: number, y: number, zoom: number): Promise<void> => {
    await api.patch(`/boards/${boardId}/viewport`, { x, y, zoom });
  },

  getNotes:     async (boardId: string): Promise<Note[]> =>
    unwrap<Note[]>(await api.get(`/boards/${boardId}/notes`), 'notes'),

  searchNotes:  async (boardId: string, q: string, type?: string, color?: string): Promise<Note[]> => {
    const params = new URLSearchParams({ q });
    if (type)  params.set('type', type);
    if (color) params.set('color', color);
    return unwrap<Note[]>(
      await api.get(`/boards/${boardId}/notes/search?${params}`), 'notes'
    );
  },

  getArchivedNotes: async (boardId: string): Promise<Note[]> =>
    unwrap<Note[]>(await api.get(`/boards/${boardId}/notes/archived`), 'notes'),

  restoreNote:  async (boardId: string, noteId: string): Promise<Note> =>
    unwrap<Note>(await api.patch(`/boards/${boardId}/notes/${noteId}/restore`), 'note'),

  createNote:   async (boardId: string, payload: {
    type?: NoteType; color?: NoteColor; x?: number; y?: number;
    content?: string; reminderAt?: string;
  }): Promise<Note> =>
    unwrap<Note>(await api.post(`/boards/${boardId}/notes`, payload), 'note'),

  updateNote:   async (boardId: string, noteId: string, updates: Partial<Note>): Promise<Note> =>
    unwrap<Note>(await api.patch(`/boards/${boardId}/notes/${noteId}`, updates), 'note'),

  updatePosition: async (boardId: string, noteId: string, x: number, y: number): Promise<void> => {
    await api.patch(`/boards/${boardId}/notes/${noteId}/position`, { x, y });
  },

  bringToFront: async (boardId: string, noteId: string): Promise<void> => {
    await api.patch(`/boards/${boardId}/notes/${noteId}/front`);
  },

  deleteNote:   async (boardId: string, noteId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}/notes/${noteId}`);
  },

  duplicateNote: async (boardId: string, noteId: string): Promise<Note> =>
    unwrap<Note>(await api.post(`/boards/${boardId}/notes/${noteId}/duplicate`), 'note'),
};
