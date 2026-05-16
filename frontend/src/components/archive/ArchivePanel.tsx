import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Trash2, Archive } from 'lucide-react';
import { boardApi } from '@/services/boardApi';
import { useNoteStore } from '@/stores/note.store';
import type { Note } from '@/types/note.types';
import { NOTE_COLORS, NOTE_TYPE_META } from '@/lib/noteColors';

interface Props {
  boardId: string;
  onClose: () => void;
}

export function ArchivePanel({ boardId, onClose }: Props) {
  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const addNote = useNoteStore((s) => s.addNote);

  useEffect(() => {
    boardApi.getArchivedNotes(boardId)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [boardId]);

  const handleRestore = async (note: Note) => {
    try {
      const restored = await boardApi.restoreNote(boardId, note._id);
      addNote(restored);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Slide-in panel from right */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 360, zIndex: 201,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'rgba(107,114,128,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Archive size={16} color="#6b7280"/>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>Archive</div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              {notes.length} deleted note{notes.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: '#aaa', display: 'flex', padding: '4px',
          }}>
            <X size={18}/>
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
              Loading archive…
            </div>
          )}
          {!loading && notes.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ccc' }}>
              <Archive size={40} style={{ margin: '0 auto 12px', display: 'block' }}/>
              <div style={{ fontSize: '13px' }}>No archived notes</div>
            </div>
          )}
          {notes.map((note) => {
            const colors = NOTE_COLORS[note.color];
            const meta   = NOTE_TYPE_META[note.type];
            return (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px', marginBottom: '8px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', color: '#555', lineHeight: 1.4,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {note.content || 'Empty note'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                    {meta.label} · {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleRestore(note)}
                  title="Restore to board"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '8px', padding: '6px',
                    cursor: 'pointer', color: '#22c55e',
                    display: 'flex', flexShrink: 0,
                  }}
                >
                  <RotateCcw size={13}/>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
