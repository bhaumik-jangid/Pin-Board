import { createPortal } from 'react-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { boardApi } from '@/services/boardApi';
import { useNoteStore } from '@/stores/note.store';
import type { Note, NoteType, NoteColor } from '@/types/note.types';

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
      { type:'idea',   color:'purple', content:'💡 Core idea here',          x:100, y:80  },
      { type:'idea',   color:'yellow', content:'Related idea 1',             x:340, y:60  },
      { type:'idea',   color:'blue',   content:'Related idea 2',             x:560, y:100 },
      { type:'normal', color:'green',  content:'Action items',               x:200, y:280 },
      { type:'urgent', color:'pink',   content:'⚠️ Constraint or blocker',   x:460, y:280 },
    ],
  },
  {
    id: 'sprint',
    name: 'Sprint Board',
    icon: '🏃',
    description: 'To-do, in progress, done columns',
    notes: [
      { type:'normal', color:'yellow', content:'📋 TO DO',          x:60,  y:60  },
      { type:'task',   color:'yellow', content:'Task A\nTask B',    x:60,  y:160 },
      { type:'normal', color:'blue',   content:'🔄 IN PROGRESS',    x:280, y:60  },
      { type:'task',   color:'blue',   content:'Task C',            x:280, y:160 },
      { type:'normal', color:'green',  content:'✅ DONE',           x:500, y:60  },
      { type:'task',   color:'green',  content:'Task D\nTask E',    x:500, y:160 },
    ],
  },
  {
    id: 'study',
    name: 'Study Planner',
    icon: '📚',
    description: 'Subjects, topics, revision schedule',
    notes: [
      { type:'normal',   color:'purple', content:'📚 Subject: ___',           x:80,  y:80  },
      { type:'task',     color:'blue',   content:'Topics to cover',           x:320, y:80  },
      { type:'reminder', color:'green',  content:'📅 Exam date',              x:560, y:80  },
      { type:'normal',   color:'yellow', content:'Key formulas / notes',      x:80,  y:300 },
      { type:'urgent',   color:'pink',   content:'🚨 Must revise!',           x:380, y:300 },
    ],
  },
  {
    id: 'retrospective',
    name: 'Retrospective',
    icon: '🔁',
    description: 'What went well, what didn\'t, actions',
    notes: [
      { type:'normal', color:'green',  content:'😊 What went well',     x:60,  y:60  },
      { type:'normal', color:'pink',   content:'😤 What didn\'t',       x:300, y:60  },
      { type:'normal', color:'blue',   content:'💬 What we learned',    x:540, y:60  },
      { type:'task',   color:'yellow', content:'Action items for next', x:200, y:300 },
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
      const created: Note[] = [];
      for (const n of template.notes) {
        const note = await boardApi.createNote(boardId, n);
        created.push(note);
        addNote(note);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(null); onClose(); }
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.9,   y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 9001,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '22px', width: 520,
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#8b5cf6"/>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>Templates</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              One click to populate your board
            </div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: '#aaa', display: 'flex', padding: '4px',
          }}>
            <X size={18}/>
          </button>
        </div>

        {/* Template grid */}
        <div style={{
          padding: '20px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {TEMPLATES.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleApply(t)}
              disabled={!!loading}
              style={{
                padding: '16px', borderRadius: '16px', border: 'none',
                background: loading === t.id
                  ? 'rgba(139,92,246,0.12)'
                  : 'rgba(0,0,0,0.03)',
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                {loading === t.id ? 'Adding notes…' : t.name}
              </div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.5 }}>
                {t.description}
              </div>
              <div style={{
                marginTop: '10px', fontSize: '10px',
                color: '#a78bfa', fontWeight: 600,
              }}>
                {t.notes.length} notes
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
