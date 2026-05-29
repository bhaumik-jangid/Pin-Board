import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CornerIndex } from '@/stores/board.store';

interface Props {
  index:    CornerIndex;
  inserted: boolean;
  onRemove: () => void;
  style:    React.CSSProperties;
}

/* Each corner pin tilts inward naturally */
const TILT: Record<CornerIndex, number> = {
  0: -12, 1: 12, 2: 12, 3: -12,
};

export function CornerPin({ index, inserted, onRemove, style }: Props) {
  const [hov, setHov] = useState(false);

  return (
    <AnimatePresence>
      {inserted && (
        <motion.button
          key={`cpin-${index}`}
          onClick={onRemove}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          title="Click to remove pin"
          style={{
            position: 'absolute', zIndex: 50,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
            filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.60))
                     drop-shadow(0 2px 4px rgba(0,0,0,0.40))`,
            ...style,
          }}
          initial={{ scale: 0.3, opacity: 0, rotate: TILT[index] - 30 }}
          animate={{
            scale: hov ? 1.10 : 1,
            opacity: 1,
            rotate: TILT[index],
            y: hov ? -5 : 0,
          }}
          exit={{
            scale: 0.5, opacity: 0, y: -70,
            rotate: TILT[index] + (index < 2 ? -35 : 35),
            transition: { type: 'spring', stiffness: 220, damping: 16 },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <CornerPinSVG />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function CornerPinSVG() {
  return (
    <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
      {/* Outer rim */}
      <circle cx="28" cy="24" r="23" fill="url(#cg1)"/>
      <circle cx="28" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="1.5"/>
      {/* Mid ring */}
      <circle cx="28" cy="24" r="16" fill="url(#cg2)"/>
      {/* Inner dome */}
      <circle cx="28" cy="24" r="10" fill="url(#cg3)"/>
      {/* Highlight */}
      <ellipse cx="22" cy="17" rx="6" ry="3.5" fill="white" fillOpacity="0.55"/>
      {/* Rim shadow arc */}
      <path d="M10 40 Q28 48 46 40" stroke="rgba(0,0,0,0.18)"
            strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Needle */}
      <line x1="28" y1="47" x2="28" y2="68"
            stroke="#5a5a5a" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="28" y1="47" x2="28" y2="68"
            stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="28" cy="67" r="3" fill="rgba(0,0,0,0.40)"/>

      <defs>
        <radialGradient id="cg1" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#d8d8d8"/>
          <stop offset="45%"  stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#606060"/>
        </radialGradient>
        <radialGradient id="cg2" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#e0e0e0"/>
          <stop offset="100%" stopColor="#909090"/>
        </radialGradient>
        <radialGradient id="cg3" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#f0f0f0"/>
          <stop offset="100%" stopColor="#b0b0b0"/>
        </radialGradient>
      </defs>
    </svg>
  );
}
