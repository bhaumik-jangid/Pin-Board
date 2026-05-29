import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '@/stores/board.store';

export function LockIndicator() {
  const { removedCount, isLocked } = useBoardStore();

  /* Always render something when pins have been touched */
  const show = removedCount > 0 || !isLocked;
  if (!show) return null;

  const stability = Math.max(0, 100 - removedCount * 22);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.90 }}
        animate={{ opacity: 1, y: 0,   scale: 1    }}
        exit={{   opacity: 0, y: -10,  scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{
          position: 'absolute',
          top: 16, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 45,
          background: isLocked
            ? 'rgba(30,24,16,0.88)'
            : 'rgba(34,197,94,0.18)',
          backdropFilter: 'blur(12px)',
          border: isLocked
            ? '1px solid rgba(255,255,255,0.12)'
            : '1px solid rgba(34,197,94,0.35)',
          borderRadius: '30px',
          padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '14px' }}>
          {removedCount === 0 ? '🔓' : '〰️'}
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: isLocked ? 'rgba(255,255,255,0.85)' : '#16a34a',
          fontFamily: 'Inter, sans-serif',
        }}>
          {removedCount} pin{removedCount !== 1 ? 's' : ''} removed
          {' • '}Board stability: {stability}%
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
