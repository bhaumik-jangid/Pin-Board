import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { boardApi } from '@/services/boardApi';
import { useNoteStore } from '@/stores/note.store';
import type { NoteType, NoteColor } from '@/types/note.types';

interface TemplateNote {
  type:    NoteType;
  color:   NoteColor;
  content: string;
  x:       number;
  y:       number;
}

interface Template {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  notes:       TemplateNote[];
}

const TEMPLATES: Template[] = [
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    icon: '🧠',
    description: 'Idea capture board with color-coded clusters',
    notes: [
      { type: 'idea',   color: 'purple', content: '💡 Core idea here',        x: 100, y: 80  },
      { type: 'idea',   color: 'yellow', content: 'Related idea 1',            x: 340, y: 60  },
      { type: 'idea',   color: 'blue',   content: 'Related idea 2',            x: 560, y: 100 },
      { type: 'normal', color: 'green',  content: 'Action items',              x: 200, y: 300 },
      { type: 'urgent', color: 'pink',   content: '⚠️ Constraint or blocker', x: 460, y: 300 },
    ],
  },
  {
    id: 'sprint',
    name: 'Sprint Board',
    icon: '🏃',
    description: 'To-do, in progress, done columns',
    notes: [
      { type: 'normal', color: 'yellow', content: '📋 TO DO',       x: 60,  y: 60  },
      { type: 'task',   color: 'yellow', content: 'Task A\nTask B', x: 60,  y: 180 },
      { type: 'normal', color: 'blue',   content: '🔄 IN PROGRESS', x: 280, y: 60  },
      { type: 'task',   color: 'blue',   content: 'Task C',         x: 280, y: 180 },
      { type: 'normal', color: 'green',  content: '✅ DONE',        x: 500, y: 60  },
      { type: 'task',   color: 'green',  content: 'Task D\nTask E', x: 500, y: 180 },
    ],
  },
  {
    id: 'study',
    name: 'Study Planner',
    icon: '📚',
    description: 'Subjects, topics, revision schedule',
    notes: [
      { type: 'normal',   color: 'purple', content: '📚 Subject: ___',      x: 80,  y: 80  },
      { type: 'task',     color: 'blue',   content: 'Topics to cover',      x: 320, y: 80  },
      { type: 'reminder', color: 'green',  content: '📅 Exam date',         x: 560, y: 80  },
      { type: 'normal',   color: 'yellow', content: 'Key formulas / notes', x: 80,  y: 320 },
      { type: 'urgent',   color: 'pink',   content: '🚨 Must revise!',      x: 380, y: 320 },
    ],
  },
  {
    id: 'retrospective',
    name: 'Retrospective',
    icon: '🔁',
    description: "What went well, what didn't, actions",
    notes: [
      { type: 'normal', color: 'green',  content: '😊 What went well',      x: 60,  y: 60  },
      { type: 'normal', color: 'pink',   content: "😤 What didn't",         x: 300, y: 60  },
      { type: 'normal', color: 'blue',   content: '💬 What we learned',     x: 540, y: 60  },
      { type: 'task',   color: 'yellow', content: 'Action items for next',  x: 200, y: 300 },
    ],
  },
];

interface Props {
  boardId: string;
  onClose: () => void;
}

export function TemplatesModal({ boardId, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const addNote = useNoteStore((s) => s.addNote);

  const handleApply = async (template: Template) => {
    setLoading(template.id);
    try {
      for (const n of template.notes) {
        const note = await boardApi.createNote(boardId, n);
        addNote(note);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
      onClose();
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.92,  y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: 'min(520px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 48px)',
          background: 'rgba(255,255,255,0.99)',
          borderRadius: '22px',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: '10px',
            background: 'rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              Templates
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              One click to populate your board with a preset layout
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: 30, height: 30,
              borderRadius: '8px', background: 'rgba(0,0,0,0.06)',
              border: 'none', cursor: 'pointer', color: '#777',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Template grid */}
        <div style={{
          padding: '20px 24px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          overflowY: 'auto',
        }}>
          {TEMPLATES.map((t) => {
            const isLoading = loading === t.id;
            const isDisabled = loading !== null;
            return (
              <motion.button
                key={t.id}
                whileHover={isDisabled ? {} : { scale: 1.02, y: -2 }}
                whileTap={isDisabled ? {} : { scale: 0.97 }}
                onClick={() => !isDisabled && handleApply(t)}
                style={{
                  padding: '18px 16px',
                  borderRadius: '16px',
                  background: isLoading
                    ? 'rgba(139,92,246,0.10)'
                    : 'rgba(0,0,0,0.025)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: isDisabled && !isLoading ? 0.5 : 1,
                  transition: 'background 0.15s, opacity 0.15s',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {t.icon}
                </div>
                <div style={{
                  fontSize: '13px', fontWeight: 700,
                  color: '#1a1a1a', marginBottom: '4px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {isLoading ? 'Adding notes…' : t.name}
                </div>
                <div style={{
                  fontSize: '11px', color: '#888',
                  lineHeight: 1.5, fontFamily: 'Inter, sans-serif',
                }}>
                  {t.description}
                </div>
                <div style={{
                  marginTop: '10px', fontSize: '10px',
                  color: '#a78bfa', fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {t.notes.length} notes
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
