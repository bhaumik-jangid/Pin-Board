
import { create } from 'zustand';
import type { Note, Board } from '@/types/note.types';

interface NoteState {
  notes: Record<string, Note>;
  board: Board | null;
  selectedNoteId: string | null;
  isLoading: boolean;

  setBoard: (board: Board) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  setLoading: (v: boolean) => void;
  getOrderedNotes: () => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: {},
  board: null,
  selectedNoteId: null,
  isLoading: false,

  setBoard: (board) => set({ board }),

  setNotes: (notes) => {
    const map: Record<string, Note> = {};
    notes.forEach((n) => { map[n._id] = n; });
    set({ notes: map });
  },

  addNote: (note) =>
    set((s) => ({ notes: { ...s.notes, [note._id]: note } })),

  updateNote: (id, updates) =>
    set((s) => ({
      notes: {
        ...s.notes,
        [id]: s.notes[id] ? { ...s.notes[id], ...updates } : s.notes[id],
      },
    })),

  removeNote: (id) =>
    set((s) => {
      const next = { ...s.notes };
      delete next[id];
      return { notes: next };
    }),

  selectNote: (id) => set({ selectedNoteId: id }),

  setLoading: (isLoading) => set({ isLoading }),

  getOrderedNotes: () =>
    Object.values(get().notes).sort((a, b) => a.zIndex - b.zIndex),
}));
