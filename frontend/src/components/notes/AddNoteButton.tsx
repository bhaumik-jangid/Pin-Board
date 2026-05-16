import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { NoteType, NoteColor } from '@/types/note.types';
import { NOTE_TYPE_META, NOTE_COLORS } from '@/lib/noteColors';
import { boardApi } from '@/services/boardApi';
import { useNoteStore } from '@/stores/note.store';

interface Props { boardId: string; }

const TYPES = Object.entries(NOTE_TYPE_META) as [NoteType, typeof NOTE_TYPE_META[NoteType]][];

export function AddNoteButton({ boardId }: Props) {
  const [open, setOpen] = useState(false);
  const addNote = useNoteStore((s) => s.addNote);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async (type: NoteType) => {
    setOpen(false);
    const color: NoteColor = NOTE_TYPE_META[type].defaultColor;
    const x = 80 + Math.random() * 300;
    const y = 80 + Math.random() * 200;
    try {
      const note = await boardApi.createNote(boardId, { type, color, x, y });
      addNote(note);
    } catch (e) {
      console.error('Failed to create note:', e);
    }
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/80 hover:bg-white rounded-xl shadow-md border border-white/60 text-cork-700 font-medium text-sm transition-colors backdrop-blur-sm"
      >
        <Plus size={16} />
        Add note
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="absolute bottom-full mb-2 left-0 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/70 overflow-hidden"
          >
            {TYPES.map(([type, meta]) => {
              const col = NOTE_COLORS[meta.defaultColor];
              return (
                <button
                  key={type}
                  onClick={() => handleCreate(type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: col.bg, border: `1px solid ${col.border}` }}
                  >
                    {meta.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
