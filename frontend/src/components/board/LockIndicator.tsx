import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isLocked: boolean;
  pinsRemaining: number;
}

export function LockIndicator({ isLocked, pinsRemaining }: Props) {
  return (
    <AnimatePresence>
      {isLocked && pinsRemaining > 0 && pinsRemaining < 4 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '8px 18px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#5a3e1b',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🔒</span>
          Remove {pinsRemaining} more pin{pinsRemaining !== 1 ? 's' : ''} to unlock board
        </motion.div>
      )}
      {!isLocked && (
        <motion.div
          key="unlocked"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.35)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '8px 18px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#14532d',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🔓</span>
          Board unlocked — you can pan the canvas
        </motion.div>
      )}
    </AnimatePresence>
  );
}
