import { useNoteStore } from '@/stores/note.store';
import { NOTE_COLORS } from '@/lib/noteColors';

interface Props {
  viewportX: number;
  viewportY: number;
  zoom:      number;
}

const MAP_W = 160;
const MAP_H = 100;
const BOARD_W = 3000;
const BOARD_H = 2000;

export function MiniMap({ viewportX, viewportY, zoom }: Props) {
  const notes = useNoteStore((s) => s.getOrderedNotes());

  const scaleX = MAP_W / BOARD_W;
  const scaleY = MAP_H / BOARD_H;

  /* Viewport rect on minimap */
  const vpW = Math.min(MAP_W, (window.innerWidth  / zoom) * scaleX);
  const vpH = Math.min(MAP_H, (window.innerHeight / zoom) * scaleY);
  const vpX = Math.max(0, Math.min(MAP_W - vpW, (-viewportX / zoom) * scaleX));
  const vpY = Math.max(0, Math.min(MAP_H - vpH, (-viewportY / zoom) * scaleY));

  return (
    <div style={{
      position: 'absolute',
      bottom: 100, right: 20,
      width: MAP_W, height: MAP_H,
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      zIndex: 45,
    }}>
      {/* Note dots */}
      {notes.map((n) => (
        <div
          key={n._id}
          style={{
            position: 'absolute',
            left:   n.x * scaleX,
            top:    n.y * scaleY,
            width:  Math.max(4, n.width  * scaleX),
            height: Math.max(4, n.height * scaleY),
            backgroundColor: NOTE_COLORS[n.color].bg,
            border: `1px solid ${NOTE_COLORS[n.color].border}`,
            borderRadius: '1px',
            opacity: 0.85,
          }}
        />
      ))}

      {/* Viewport rect */}
      <div style={{
        position: 'absolute',
        left:   vpX, top:  vpY,
        width:  vpW, height: vpH,
        border: '1.5px solid rgba(90,62,27,0.6)',
        borderRadius: '2px',
        background: 'rgba(90,62,27,0.06)',
        pointerEvents: 'none',
      }}/>

      {/* Label */}
      <div style={{
        position: 'absolute', bottom: 3, right: 6,
        fontSize: '9px', fontWeight: 600,
        color: 'rgba(90,62,27,0.5)',
        letterSpacing: '0.04em',
      }}>
        MAP
      </div>
    </div>
  );
}
