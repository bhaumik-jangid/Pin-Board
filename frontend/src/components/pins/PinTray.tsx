import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore, type CornerIndex } from '@/stores/board.store';
import { RotateCcw } from 'lucide-react';

/* Random rotations per pin slot — stable across renders */
const SLOT_ROTATIONS = [-18, 8, -5, 22];
const SLOT_OFFSETS   = [
  { x: 0,  y: 0  },
  { x: 12, y: 4  },
  { x: -6, y: 8  },
  { x: 8,  y: 12 },
];

export function PinTray() {
  const { pins, removedCount, reinsertPin, reinsertAll } = useBoardStore();
  const removed = pins.filter((p) => !p.inserted);

  return (
    <motion.div
      initial={{ opacity:0, x:-50, scale:0.85 }}
      animate={{ opacity:1, x:0,   scale:1    }}
      exit={{   opacity:0, x:-30,  scale:0.9  }}
      transition={{ type:'spring', stiffness:300, damping:24 }}
      style={{
        position: 'absolute',
        /*
          Sits ABOVE the bottom toolbar (toolbar is bottom:24 ~72px tall → 96px total)
          and ABOVE the bottom corner pins (bottom:104 + pin height ~72px → ~176px)
          We place tray at bottom:200 to be safely clear of both.
        */
        bottom: 200,
        left:   20,
        zIndex: 55,
        width:  140,

        /* 3D card effect */
        background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(235,225,210,0.88))',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: `
          0 2px 0 rgba(0,0,0,0.06),
          0 4px 0 rgba(0,0,0,0.04),
          0 8px 24px rgba(0,0,0,0.22),
          0 2px 6px rgba(0,0,0,0.12),
          inset 0 1px 0 rgba(255,255,255,0.9)
        `,
        padding: '14px 14px 12px',
        overflow: 'visible',
      }}
    >
      {/* Tray label */}
      <div style={{
        fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'rgba(90,62,27,0.5)',
        marginBottom: '12px',
      }}>
        Pin tray · {removedCount}
      </div>

      {/* 3D pin staging area */}
      <div style={{
        position: 'relative',
        height: 72,
        marginBottom: '12px',
        /* Inset tray surface */
        background: 'linear-gradient(180deg, rgba(180,150,100,0.18), rgba(140,110,70,0.10))',
        borderRadius: '10px',
        border: '1px solid rgba(180,150,100,0.25)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.10)',
      }}>
        <AnimatePresence>
          {removed.map((pin, i) => (
            <motion.button
              key={pin.index}
              initial={{ y: -60, rotate: SLOT_ROTATIONS[i] - 20, scale: 0.4, opacity: 0 }}
              animate={{ y: 0,   rotate: SLOT_ROTATIONS[i],      scale: 1,   opacity: 1 }}
              exit={{   y: -40,  rotate: SLOT_ROTATIONS[i] + 15, scale: 0.5, opacity: 0 }}
              transition={{ type:'spring', stiffness:280, damping:18, delay: i * 0.07 }}
              whileHover={{ scale: 1.2, y: -6, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.9 }}
              onClick={() => reinsertPin(pin.index as CornerIndex)}
              title={`Click to re-insert pin ${pin.index + 1}`}
              style={{
                position: 'absolute',
                left: 14 + SLOT_OFFSETS[i].x,
                top:  8  + SLOT_OFFSETS[i].y,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                filter: `
                  drop-shadow(0 4px 8px rgba(0,0,0,0.45))
                  drop-shadow(0 1px 2px rgba(0,0,0,0.3))
                `,
                transformOrigin: 'center bottom',
              }}
            >
              {/* 3D pin SVG — larger, more detailed */}
              <svg width="32" height="46" viewBox="0 0 52 72" fill="none">
                {/* Outer ring */}
                <circle cx="26" cy="22" r="20" fill="url(#pinGrad)" />
                <circle cx="26" cy="22" r="20" fill="none"
                        stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>
                {/* Mid ring */}
                <circle cx="26" cy="22" r="14" fill="#b8b8b8"/>
                {/* Inner dome */}
                <circle cx="26" cy="22" r="9"  fill="#d0d0d0"/>
                {/* Specular highlight */}
                <ellipse cx="20" cy="15" rx="5" ry="3.5"
                         fill="white" fillOpacity="0.65"/>
                {/* Rim shadow */}
                <path d="M10 36 Q26 42 42 36"
                      stroke="rgba(0,0,0,0.18)" strokeWidth="2"
                      fill="none" strokeLinecap="round"/>
                {/* Needle */}
                <line x1="26" y1="42" x2="26" y2="70"
                      stroke="#666" strokeWidth="5" strokeLinecap="round"/>
                <line x1="26" y1="42" x2="26" y2="70"
                      stroke="rgba(255,255,255,0.25)" strokeWidth="2"
                      strokeLinecap="round"/>
                {/* Needle tip */}
                <circle cx="26" cy="70" r="3" fill="rgba(0,0,0,0.4)"/>

                <defs>
                  <radialGradient id="pinGrad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%"   stopColor="#d0d0d0"/>
                    <stop offset="50%"  stopColor="#a0a0a0"/>
                    <stop offset="100%" stopColor="#6a6a6a"/>
                  </radialGradient>
                </defs>
              </svg>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Re-lock button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={reinsertAll}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '7px 0',
          background: 'linear-gradient(135deg, rgba(90,62,27,0.12), rgba(90,62,27,0.06))',
          border: '1px solid rgba(90,62,27,0.2)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '11px', fontWeight: 600,
          color: '#5a3e1b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <RotateCcw size={11}/>
        Re-lock all
      </motion.button>
    </motion.div>
  );
}
