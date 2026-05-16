import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

interface ToastItem {
  id:      string;
  noteId:  string;
  content: string;
}

export function ReminderToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { noteId, content } = (e as CustomEvent).detail;
      const item: ToastItem = { id: `${noteId}-${Date.now()}`, noteId, content };
      setToasts((prev) => [...prev.slice(-2), item]); // max 3
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 6000);
    };
    window.addEventListener('pinboard:reminder', handler);
    return () => window.removeEventListener('pinboard:reminder', handler);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 108, right: 20,
      zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px',
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9  }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{   opacity: 0, x: 60,  scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px', padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              border: '1px solid rgba(34,197,94,0.25)',
              maxWidth: '280px',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '10px',
              background: 'rgba(34,197,94,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bell size={15} color="#22c55e"/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', marginBottom: '2px' }}>
                Reminder
              </div>
              <div style={{
                fontSize: '12px', color: '#555',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.content || 'You have a reminder!'}
              </div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#aaa', display: 'flex', padding: '2px', flexShrink: 0,
              }}
            >
              <X size={13}/>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
