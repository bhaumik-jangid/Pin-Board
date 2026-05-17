import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Props {
  noteCount: number;
  onConfirm: () => void;
  onClose:   () => void;
}

export function ClearBoardModal({ noteCount, onConfirm, onClose }: Props) {
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.92,  y: 14 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: 'min(380px, calc(100vw - 32px))',
          background: 'rgba(255,255,255,0.99)',
          borderRadius: '20px',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Warning header */}
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
          padding: '24px 24px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(239,68,68,0.12)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>
            Clear entire board?
          </div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.55 }}>
            This will archive all <strong>{noteCount}</strong> note{noteCount !== 1 ? 's' : ''}.
            You can restore them from the Archive panel.
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: '10px' }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            style={{
              flex: 1, padding: '11px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(0,0,0,0.04)',
              fontSize: '13px', fontWeight: 600, color: '#555',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <X size={14} /> Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px',
              borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              fontSize: '13px', fontWeight: 600, color: 'white',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
            }}
          >
            <Trash2 size={14} /> Clear board
          </motion.button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
