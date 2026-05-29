import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '@/stores/board.store';

export function BoardStabilityWidget() {
  const { removedCount } = useBoardStore();

  if (removedCount === 0) return null;

  /* Stability: 100% with all 4 pins, drops by 25% per removed pin */
  const stability  = Math.max(0, 100 - removedCount * 22);
  const isUnstable = stability < 60;
  const isCritical = stability < 30;

  const barColor = isCritical
    ? '#ef4444'
    : isUnstable
    ? '#f59e0b'
    : '#22c55e';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: -10 }}
        animate={{ opacity: 1, scale: 1,    y: 0   }}
        exit={{   opacity: 0, scale: 0.88,  y: -8  }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{
          position: 'absolute',
          bottom: 112, right: 16,
          zIndex: 55,
          width: 220,
          background: 'linear-gradient(160deg, #2a2520 0%, #1a1610 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.40)',
          padding: '14px 16px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          marginBottom: '10px',
        }}>
          <span style={{ fontSize: '14px' }}>
            {isCritical ? '⚠️' : isUnstable ? '〰️' : '📌'}
          </span>
          <span style={{
            fontSize: '12px', fontWeight: 700,
            color: 'rgba(255,255,255,0.90)',
            letterSpacing: '0.01em',
          }}>
            Board Stability
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.55, marginBottom: '14px',
        }}>
          {removedCount === 1
            ? 'One pin removed. Board is mostly stable.'
            : removedCount === 2
            ? 'Two pins removed. Board becoming unstable.'
            : removedCount === 3
            ? 'Three pins removed! Board is very unstable.'
            : 'All pins removed. Board is free to move.'}
        </p>

        {/* Percentage + label */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: '8px',
        }}>
          <span style={{
            fontSize: '26px', fontWeight: 700,
            color: barColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {stability}%
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: barColor, opacity: 0.85,
          }}>
            {isCritical ? 'Critical' : isUnstable ? 'Unstable' : 'Stable'}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 6, borderRadius: 3,
          background: 'rgba(255,255,255,0.10)',
          overflow: 'hidden', marginBottom: '10px',
        }}>
          <motion.div
            animate={{ width: `${stability}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              height: '100%', borderRadius: 3,
              background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
              boxShadow: `0 0 8px ${barColor}60`,
            }}
          />
        </div>

        {/* Scale ticks */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '9px', color: 'rgba(255,255,255,0.25)',
        }}>
          {['0%','25%','50%','75%','100%'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
