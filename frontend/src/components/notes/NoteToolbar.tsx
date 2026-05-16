import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Copy, Bell } from 'lucide-react';
import type { NoteColor } from '@/types/note.types';
import { NOTE_COLORS } from '@/lib/noteColors';
import { ReminderModal } from '@/components/reminders/ReminderModal';

interface Props {
  boardId:       string;
  noteId:        string;
  currentColor:  NoteColor;
  reminderAt?:   string;
  onDelete:      () => void;
  onDuplicate:   () => void;
  onColorChange: (c: NoteColor) => void;
}

const COLORS = Object.keys(NOTE_COLORS) as NoteColor[];

export function NoteToolbar({
  boardId, noteId, currentColor, reminderAt,
  onDelete, onDuplicate, onColorChange,
}: Props) {
  const [showReminder, setShowReminder] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity:0, y:-8, scale:0.88 }}
        animate={{ opacity:1, y:0,  scale:1    }}
        exit={{   opacity:0, y:-6, scale:0.92  }}
        transition={{ duration: 0.14 }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: -48, left: '50%',
          transform: 'translateX(-50%)', zIndex: 30,
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
          borderRadius: '14px', padding: '6px 10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.07)',
          pointerEvents: 'auto', whiteSpace: 'nowrap',
        }}
      >
        {/* Color swatches */}
        {COLORS.map((c) => (
          <button key={c} onClick={() => onColorChange(c)} style={{
            width: 16, height: 16, borderRadius: '50%', border: 'none',
            backgroundColor: NOTE_COLORS[c].bg, cursor: 'pointer',
            outline: c === currentColor ? `2px solid ${NOTE_COLORS[c].pin}` : '2px solid transparent',
            outlineOffset: '1px', transition: 'transform 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}
        <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }}/>
        {/* Reminder */}
        <button
          onClick={() => setShowReminder(true)}
          title="Set reminder"
          style={{
            background: reminderAt ? 'rgba(34,197,94,0.12)' : 'transparent',
            border: 'none', cursor: 'pointer', color: reminderAt ? '#22c55e' : '#666',
            padding: '4px', borderRadius: '6px', display: 'flex',
          }}
        >
          <Bell size={13}/>
        </button>
        {/* Duplicate */}
        <button onClick={onDuplicate} title="Duplicate" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#666', padding: '4px', borderRadius: '6px', display: 'flex',
        }}>
          <Copy size={13}/>
        </button>
        {/* Delete */}
        <button onClick={onDelete} title="Delete" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#ef4444', padding: '4px', borderRadius: '6px', display: 'flex',
        }}>
          <Trash2 size={13}/>
        </button>
      </motion.div>

      {/* Reminder modal — portal-like, rendered here */}
      <AnimatePresence>
        {showReminder && (
          <ReminderModal
            boardId={boardId}
            noteId={noteId}
            current={reminderAt}
            onClose={() => setShowReminder(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
