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
        initial={{ opacity: 0, y: -8, scale: 0.88 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: -6,  scale: 0.92 }}
        transition={{ duration: 0.13 }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: -52, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30, pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(14px)',
          borderRadius: '16px', padding: '7px 11px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.20), 0 1px 4px rgba(0,0,0,0.10)',
          border: '1px solid rgba(0,0,0,0.07)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Color swatches */}
        {COLORS.map((c) => (
          <button key={c} onClick={() => onColorChange(c)} style={{
            width: 17, height: 17, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            backgroundColor: NOTE_COLORS[c].bg,
            boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.12)`,
            outline: c === currentColor
              ? `2.5px solid ${NOTE_COLORS[c].pin}`
              : '2.5px solid transparent',
            outlineOffset: '1.5px',
            transition: 'transform 0.12s',
            flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.30)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.10)', margin: '0 2px' }}/>

        {/* Reminder */}
        <IconBtn
          title="Reminder"
          active={!!reminderAt}
          activeColor="#22c55e"
          onClick={() => setShowReminder(true)}
        >
          <Bell size={13}/>
        </IconBtn>

        {/* Duplicate */}
        <IconBtn title="Duplicate" onClick={onDuplicate}>
          <Copy size={13}/>
        </IconBtn>

        {/* Delete */}
        <IconBtn title="Delete" danger onClick={onDelete}>
          <Trash2 size={13}/>
        </IconBtn>
      </motion.div>

      <AnimatePresence>
        {showReminder && (
          <ReminderModal
            boardId={boardId} noteId={noteId}
            current={reminderAt}
            onClose={() => setShowReminder(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({
  children, onClick, title, danger, active, activeColor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  active?: boolean;
  activeColor?: string;
}) {
  const [hov, setHov] = useState(false);
  const color = danger
    ? (hov ? '#dc2626' : '#ef4444')
    : active
    ? (activeColor ?? '#333')
    : (hov ? '#222' : '#666');

  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active ? `${activeColor}18` : hov ? 'rgba(0,0,0,0.06)' : 'transparent',
        border: 'none', cursor: 'pointer', color,
        padding: '5px', borderRadius: '7px',
        display: 'flex', transition: 'all 0.13s',
      }}
    >
      {children}
    </button>
  );
}
