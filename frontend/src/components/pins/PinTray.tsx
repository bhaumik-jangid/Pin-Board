import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore, type CornerIndex } from '@/stores/board.store';

/* Randomised resting positions inside the tray — stable per slot */
const RESTING = [
  { x: 14, y: 12, r: -35, s: 1.00 },
  { x: 48, y: 22, r:  20, s: 0.92 },
  { x: 28, y: 38, r: -15, s: 0.96 },
  { x: 58, y:  8, r:  45, s: 0.88 },
];

export function PinTray() {
  const { pins, reinsertPin, reinsertAll } = useBoardStore();
  const removed = pins.filter((p) => !p.inserted);

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.88 }}
      animate={{ opacity: 1, x: 0,   scale: 1    }}
      exit={{   opacity: 0, x: -30,  scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{
        position: 'absolute',
        bottom: 112, left: 16,
        zIndex: 55,
        width: 148,
      }}
    >
      {/* Label */}
      <div style={{
        fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)',
        textTransform: 'uppercase', letterSpacing: '0.10em',
        marginBottom: '6px', paddingLeft: '2px',
        fontFamily: 'Inter, sans-serif',
      }}>
        Pin Tray
      </div>

      {/* Tray container — dark matte like reference */}
      <div style={{
        background: 'linear-gradient(160deg, #2e2820 0%, #1e1a14 100%)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.55),
          0 2px 8px rgba(0,0,0,0.40),
          inset 0 1px 0 rgba(255,255,255,0.06),
          inset 0 -1px 0 rgba(0,0,0,0.30)
        `,
        padding: '10px 10px 12px',
        overflow: 'hidden',
      }}>
        {/* Tray well — inset surface */}
        <div style={{
          position: 'relative',
          height: 84,
          background: 'linear-gradient(160deg, #1a1510 0%, #120f0a 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.50)',
          boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.60)',
          marginBottom: '10px',
          overflow: 'hidden',
        }}>
          <AnimatePresence>
            {removed.map((pin, i) => {
              const rest = RESTING[i] ?? RESTING[0];
              return (
                <motion.button
                  key={pin.index}
                  initial={{ y: -60, rotate: rest.r - 40, scale: 0.4, opacity: 0 }}
                  animate={{ y: 0,   rotate: rest.r,      scale: rest.s, opacity: 1 }}
                  exit={{   y: -50,  opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.06 }}
                  whileHover={{ scale: rest.s * 1.18, y: -5 }}
                  whileTap={{ scale: rest.s * 0.92 }}
                  onClick={() => reinsertPin(pin.index as CornerIndex)}
                  title="Click to re-insert"
                  style={{
                    position: 'absolute',
                    left: rest.x, top: rest.y,
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.70))',
                    transformOrigin: 'center bottom',
                  }}
                >
                  {/* Mini tray pin — similar to reference */}
                  <svg width="30" height="40" viewBox="0 0 56 68" fill="none">
                    <circle cx="28" cy="24" r="23" fill="url(#tg1)"/>
                    <circle cx="28" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5"/>
                    <circle cx="28" cy="24" r="15" fill="url(#tg2)"/>
                    <circle cx="28" cy="24" r="9"  fill="url(#tg3)"/>
                    <ellipse cx="22" cy="17" rx="5.5" ry="3" fill="white" fillOpacity="0.55"/>
                    <line x1="28" y1="47" x2="28" y2="68"
                          stroke="#4a4a4a" strokeWidth="5" strokeLinecap="round"/>
                    <circle cx="28" cy="67" r="3" fill="rgba(0,0,0,0.50)"/>
                    <defs>
                      <radialGradient id="tg1" cx="40%" cy="35%" r="65%">
                        <stop offset="0%"   stopColor="#c8a060"/>
                        <stop offset="50%"  stopColor="#8a6030"/>
                        <stop offset="100%" stopColor="#4a3010"/>
                      </radialGradient>
                      <radialGradient id="tg2" cx="40%" cy="35%" r="65%">
                        <stop offset="0%"   stopColor="#d4aa70"/>
                        <stop offset="100%" stopColor="#7a5020"/>
                      </radialGradient>
                      <radialGradient id="tg3" cx="35%" cy="30%" r="65%">
                        <stop offset="0%"   stopColor="#e8c880"/>
                        <stop offset="100%" stopColor="#a07038"/>
                      </radialGradient>
                    </defs>
                  </svg>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {removed.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'rgba(255,255,255,0.20)',
              fontFamily: 'Inter, sans-serif',
            }}>
              empty
            </div>
          )}
        </div>

        {/* Re-lock button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={reinsertAll}
          style={{
            width: '100%', padding: '7px 0',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '11px', fontWeight: 600,
            color: 'rgba(255,255,255,0.70)',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '5px',
          }}
        >
          🔒 Re-lock all
        </motion.button>
      </div>
    </motion.div>
  );
}
