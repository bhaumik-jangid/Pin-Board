import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, Trash2 } from 'lucide-react';
import { boardApi } from '@/services/boardApi';
import { useNoteStore } from '@/stores/note.store';

interface Props {
  boardId: string;
  noteId:  string;
  current?: string;   /* ISO string or undefined */
  onClose: () => void;
}

export function ReminderModal({ boardId, noteId, current, onClose }: Props) {
  /* Pre-fill with existing or next hour */
  const defaultDT = () => {
    if (current) return current.slice(0, 16);
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [dt,      setDt]      = useState(defaultDT);
  const [saving,  setSaving]  = useState(false);
  const updateNote = useNoteStore((s) => s.updateNote);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await boardApi.updateNote(boardId, noteId, {
        reminderAt: new Date(dt).toISOString(),
      });
      updateNote(noteId, { reminderAt: updated.reminderAt });
      onClose();
    } finally { setSaving(false); }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await boardApi.updateNote(boardId, noteId, { reminderAt: undefined });
      updateNote(noteId, { reminderAt: undefined });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.9,   y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 301,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '20px', width: 340,
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={16} color="#22c55e" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>Set reminder</div>
            <div style={{ fontSize: '11px', color: '#888' }}>You'll get a notification when it's due</div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: '#aaa', display: 'flex', padding: '4px',
          }}>
            <X size={16}/>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: '12px', fontSize: '14px',
              color: '#333', background: '#f8f8f8',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#22c55e')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />

          {/* Preview */}
          {dt && (
            <div style={{
              marginTop: '10px', padding: '8px 12px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '10px', fontSize: '12px', color: '#15803d',
            }}>
              🔔 Reminder set for {new Date(dt).toLocaleString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {current && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleClear}
                disabled={saving}
                style={{
                  flex: 1, padding: '10px', borderRadius: '12px',
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.06)',
                  color: '#ef4444', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                }}
              >
                <Trash2 size={13}/> Clear
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={saving || !dt}
              style={{
                flex: 2, padding: '10px', borderRadius: '12px',
                border: 'none',
                background: saving ? '#86efac' : '#22c55e',
                color: 'white', fontSize: '13px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              <Bell size={13}/> {saving ? 'Saving…' : 'Set reminder'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
