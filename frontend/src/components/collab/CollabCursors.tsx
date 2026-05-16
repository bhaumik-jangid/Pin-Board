import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore } from '@/stores/collab.store';

export function CollabCursors() {
  const cursors = useCollabStore((s) => s.cursors);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 90, overflow: 'hidden',
    }}>
      <AnimatePresence>
        {Object.values(cursors).map((c) => (
          <motion.div
            key={c.userId}
            style={{ position: 'absolute', left: c.x, top: c.y }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            {/* SVG cursor */}
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none"
                 style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>
              <path d="M4 2L16 10L10 11L7 18L4 2Z"
                    fill={c.avatarColor} stroke="white" strokeWidth="1.5"
                    strokeLinejoin="round"/>
            </svg>
            {/* Name chip */}
            <div style={{
              position: 'absolute', top: 18, left: 12,
              backgroundColor: c.avatarColor,
              color: 'white', fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              {c.username}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
