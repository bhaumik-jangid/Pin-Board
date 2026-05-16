import { motion } from 'framer-motion';

interface Props { color: string; size?: number; }

export function NotePin({ color, size = 24 }: Props) {
  const half = size / 2;
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: -(half + 6),
        left: '50%',
        marginLeft: -(half / 2),   /* half of SVG width/2 to truly center */
        zIndex: 20,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
      }}
      initial={{ y: -80, rotate: -30, scale: 0.4, opacity: 0 }}
      animate={{ y: 0,   rotate: 0,   scale: 1.0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 10,
        mass: 1.2,
        delay: 0.1,
      }}
    >
      <svg width={size} height={size + 12} viewBox="0 0 24 36" fill="none">
        {/* Outer circle */}
        <circle cx="12" cy="11" r="10" fill={color} />
        {/* Rim */}
        <circle cx="12" cy="11" r="10" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {/* Inner gloss dome */}
        <circle cx="12" cy="11" r="6.5" fill="white" fillOpacity="0.2" />
        {/* Specular highlight */}
        <ellipse cx="9" cy="8" rx="3" ry="2" fill="white" fillOpacity="0.55" />
        {/* Needle */}
        <line x1="12" y1="21" x2="12" y2="36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="12" y1="21" x2="12" y2="36" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
