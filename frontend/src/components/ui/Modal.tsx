import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
  width?: number | string;
  children: React.ReactNode;
}

/**
 * Generic modal portal — renders into document.body so it is
 * never clipped by any parent overflow:hidden.
 * Wrap any modal content with this.
 */
export function Modal({ onClose, width = 480, children }: Props) {
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.92,  y: 14 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: typeof width === 'number' ? `min(${width}px, calc(100vw - 32px))` : width,
          maxHeight: 'min(700px, calc(100vh - 48px))',
          background: 'rgba(255,255,255,0.99)',
          borderRadius: '22px',
          boxShadow: `
            0 0 0 1px rgba(0,0,0,0.06),
            0 8px 24px rgba(0,0,0,0.12),
            0 32px 80px rgba(0,0,0,0.22)
          `,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}
