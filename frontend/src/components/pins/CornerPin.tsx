import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CornerIndex } from '@/stores/board.store';

interface Props {
  index: CornerIndex;
  inserted: boolean;
  onRemove: () => void;
  /* corner positions passed from parent */
  style: React.CSSProperties;
}

/*
  Corner positions rotate the pin so it looks pushed in at an angle.
  0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
*/
const CORNER_ROTATE: Record<CornerIndex, number> = {
  0: -20,
  1:  20,
  2: -160,
  3:  160,
};

export function CornerPin({ index, inserted, onRemove, style }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <AnimatePresence>
      {inserted && (
        <motion.div
          key={`corner-pin-${index}`}
          style={{
            position: 'absolute',
            zIndex: 50,
            cursor: 'pointer',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))',
            ...style,
          }}
          initial={{ scale: 0.4, opacity: 0, rotate: CORNER_ROTATE[index] - 45 }}
          animate={{
            scale: hovered ? 1.12 : 1,
            opacity: 1,
            rotate: CORNER_ROTATE[index],
            y: hovered ? -4 : 0,
          }}
          exit={{
            scale: 0.6,
            opacity: 0,
            y: -60,
            rotate: CORNER_ROTATE[index] + (index < 2 ? -40 : 40),
            transition: { type: 'spring', stiffness: 200, damping: 14 },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          onClick={onRemove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Click to remove pin"
        >
          <PinSVG size={52} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PinSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size + 20} viewBox="0 0 52 72" fill="none">
      {/* Pin head — metallic gradient effect via layered circles */}
      <circle cx="26" cy="22" r="20" fill="#9a9a9a" />
      <circle cx="26" cy="22" r="20" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      {/* Mid ring */}
      <circle cx="26" cy="22" r="14" fill="#b8b8b8" />
      {/* Inner dome */}
      <circle cx="26" cy="22" r="9"  fill="#cecece" />
      {/* Specular highlight top-left */}
      <ellipse cx="20" cy="16" rx="5" ry="3.5" fill="white" fillOpacity="0.55" />
      {/* Rim shadow bottom */}
      <path d="M10 34 Q26 40 42 34" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Needle */}
      <line x1="26" y1="42" x2="26" y2="72"
            stroke="#707070" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="42" x2="26" y2="72"
            stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
      {/* Needle tip shadow */}
      <circle cx="26" cy="71" r="2.5" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}
