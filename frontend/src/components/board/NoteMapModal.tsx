import { createPortal } from 'react-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Navigation } from 'lucide-react';
import { useNoteStore } from '@/stores/note.store';
import { NOTE_COLORS, NOTE_TYPE_META } from '@/lib/noteColors';
import type { Note } from '@/types/note.types';

interface Props {
  onClose:  () => void;
  onJumpTo: (note: Note) => void;
}

const CANVAS_W = 3000;
const CANVAS_H = 2000;
const MAP_W    = 560;
const MAP_H    = Math.round(MAP_W * (CANVAS_H / CANVAS_W)); /* maintain aspect = 373px */

export function NoteMapModal({ onClose, onJumpTo }: Props) {
  const notes        = useNoteStore((s) => s.getOrderedNotes());
  const [hovered, setHovered] = useState<string | null>(null);

  const scaleX = MAP_W / CANVAS_W;
  const scaleY = MAP_H / CANVAS_H;

  const handleNoteClick = (note: Note) => {
    onJumpTo(note);
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.92,  y: 16 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: `min(${MAP_W + 48}px, calc(100vw - 32px))`,
          maxHeight: 'calc(100vh - 48px)',
          background: 'rgba(255,255,255,0.99)',
          borderRadius: '22px',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '12px',
            background: 'rgba(196,154,69,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={18} color="#c49a45" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              Note Map
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {notes.length} note{notes.length !== 1 ? 's' : ''} on your board — click any to jump to it
            </div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', width: 32, height: 32,
            borderRadius: '10px', background: 'rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer', color: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Map canvas */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{
              height: 200, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#ccc', gap: '12px',
            }}>
              <MapPin size={40} />
              <div style={{ fontSize: '14px' }}>No notes on the board yet</div>
            </div>
          ) : (
            <>
              {/* Visual map */}
              <div style={{
                position: 'relative',
                width: MAP_W, height: MAP_H,
                maxWidth: '100%',
                background: `
                  radial-gradient(ellipse at 20% 30%, rgba(160,110,40,0.4) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 70%, rgba(120,80,25,0.3) 0%, transparent 50%),
                  #c8a96e
                `,
                borderRadius: '12px',
                border: '1px solid rgba(196,154,69,0.4)',
                overflow: 'visible',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.15)',
                marginBottom: '20px',
              }}>
                {/* Cork grain */}
                <svg style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', opacity: 0.12,
                  borderRadius: '12px',
                }}>
                  <filter id="mn">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3"/>
                    <feColorMatrix type="saturate" values="0"/>
                  </filter>
                  <rect width="100%" height="100%" filter="url(#mn)"/>
                </svg>

                {/* Note thumbnails */}
                {notes.map((note) => {
                  const colors  = NOTE_COLORS[note.color];
                  const meta    = NOTE_TYPE_META[note.type];
                  const mx      = note.x * scaleX;
                  const my      = note.y * scaleY;
                  const mw      = Math.max(18, note.width  * scaleX);
                  const mh      = Math.max(14, note.height * scaleY);
                  const isHov   = hovered === note._id;

                  return (
                    <motion.button
                      key={note._id}
                      onClick={() => handleNoteClick(note)}
                      onMouseEnter={() => setHovered(note._id)}
                      onMouseLeave={() => setHovered(null)}
                      animate={{ scale: isHov ? 1.15 : 1, zIndex: isHov ? 10 : 1 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        position: 'absolute',
                        left: mx, top: my,
                        width: mw, height: mh,
                        backgroundColor: colors.bg,
                        border: `1.5px solid ${isHov ? colors.pin : colors.border}`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: Math.max(6, mw * 0.3) + 'px',
                        boxShadow: isHov
                          ? `0 4px 16px rgba(0,0,0,0.3), 0 0 0 2px ${colors.pin}`
                          : '0 2px 6px rgba(0,0,0,0.18)',
                        transition: 'border-color 0.12s, box-shadow 0.12s',
                        overflow: 'hidden',
                      }}
                      title={note.content || `${meta.label} note`}
                    >
                      {mw > 22 && (
                        <span style={{ fontSize: Math.min(12, mw * 0.4) }}>
                          {meta.icon}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Note list — scrollable */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#aaa',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                All notes — click to jump
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}>
                {notes.map((note) => {
                  const colors = NOTE_COLORS[note.color];
                  const meta   = NOTE_TYPE_META[note.type];
                  return (
                    <motion.button
                      key={note._id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNoteClick(note)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px', fontWeight: 600, color: colors.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {note.content || 'Empty note'}
                        </div>
                        <div style={{ fontSize: '10px', color: colors.text, opacity: 0.55, marginTop: '2px' }}>
                          {meta.label} · ({Math.round(note.x)}, {Math.round(note.y)})
                        </div>
                      </div>
                      <Navigation size={12} style={{ flexShrink: 0, color: colors.text, opacity: 0.4 }}/>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
