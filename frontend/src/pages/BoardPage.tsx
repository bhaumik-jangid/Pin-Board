import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { BoardCanvas }    from '@/components/board/BoardCanvas';
import { InfiniteCanvas } from '@/components/board/InfiniteCanvas';
import { LockIndicator }  from '@/components/board/LockIndicator';
import { CornerPin }      from '@/components/pins/CornerPin';
import { PinTray }        from '@/components/pins/PinTray';
import { CollabAvatars }  from '@/components/collab/CollabAvatars';
import { CollabCursors }  from '@/components/collab/CollabCursors';
import { CollabModal }    from '@/components/collab/CollabModal';

import { useAuthStore }   from '@/stores/auth.store';
import { useNoteStore }   from '@/stores/note.store';
import { useBoardStore, type CornerIndex } from '@/stores/board.store';

import { boardApi }       from '@/services/boardApi';
import { authApi }        from '@/services/api';
import { useSocket }      from '@/hooks/useSocket';
import { SOCKET_EVENTS }  from '@/lib/socketEvents';
import { NOTE_TYPE_META, NOTE_COLORS } from '@/lib/noteColors';
import type { NoteType, NoteColor } from '@/types/note.types';

import { SearchModal }     from '@/components/search/SearchModal';
import { TemplatesModal }  from '@/components/templates/TemplatesModal';
import { ArchivePanel }    from '@/components/archive/ArchivePanel';
import { ReminderToast }   from '@/components/reminders/ReminderToast';
import { useReminders }    from '@/hooks/useReminders';

import {
  Plus, Bell, Search, ZoomIn, ZoomOut,
  Lock, Unlock, LayoutTemplate, Users, LogOut,
} from 'lucide-react';

const NOTE_TYPES = Object.entries(NOTE_TYPE_META) as [NoteType, typeof NOTE_TYPE_META[NoteType]][];

/*
  Corner pin positions:
  - Top pins: 16px from top
  - Bottom pins: 16px from bottom (well ABOVE the toolbar at bottom:24 + ~72px height = 96px)
  - Horizontal: 16px from edges
  Bottom pins must NOT be covered by pin tray (which goes bottom: 180)
*/
const CORNER_STYLES: Record<CornerIndex, React.CSSProperties> = {
  0: { top: 16,    left:  16 },
  1: { top: 16,    right: 16 },
  2: { bottom: 104, left:  16 },   /* above toolbar */
  3: { bottom: 104, right: 16 },
};

export default function BoardPage() {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const {
    setBoard, setNotes, board, getOrderedNotes,
    isLoading, setLoading, addNote,
  } = useNoteStore();
  const { isLocked, pins, removedCount, initPins, removePin } = useBoardStore();

  const [error,       setError]       = useState('');
  const [addOpen,     setAddOpen]     = useState(false);
  const [collabOpen,  setCollabOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [tmplOpen,    setTmplOpen]    = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [vpState,     setVpState]     = useState({ x: 0, y: 0, zoom: 1 });

  const { emit }    = useSocket(board?._id ?? null);
  useReminders();
  const vpSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Cmd+K / Ctrl+K → open search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── Init board ── */
  const initBoard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const boards = await boardApi.getMyBoards();
      const target = boards.length > 0
        ? boards[0]
        : await boardApi.createBoard(`${user.username}'s Board`);
      setBoard(target);
      setNotes(await boardApi.getNotes(target._id));
    } catch (e) {
      console.error('Board init failed:', e);
      setError('Could not reach board-service on port 3002.');
    } finally {
      setLoading(false);
    }
  }, [user, setBoard, setNotes, setLoading]);

  useEffect(() => {
    initBoard();
    initPins();
  }, [initBoard, initPins]);

  /* ── Viewport persist ── */
  const handleViewportChange = useCallback((vp: { x: number; y: number; zoom: number }) => {
    setVpState(vp);
    clearTimeout(vpSaveTimer.current);
    vpSaveTimer.current = setTimeout(() => {
      if (board) boardApi.updateViewport(board._id, vp.x, vp.y, vp.zoom).catch(() => {});
    }, 800);
  }, [board]);

  /* ── Add note in viewport center ── */
  const handleAddNote = async (type: NoteType) => {
    setAddOpen(false);
    if (!board) return;
    const color: NoteColor = NOTE_TYPE_META[type].defaultColor;
    const x = (-vpState.x / vpState.zoom) + (window.innerWidth  / vpState.zoom / 2) - 100;
    const y = (-vpState.y / vpState.zoom) + (window.innerHeight / vpState.zoom / 2) - 100;
    try {
      const note = await boardApi.createNote(board._id, {
        type, color,
        x: Math.max(20, x),
        y: Math.max(20, y),
      });
      addNote(note);
      emit(SOCKET_EVENTS.NOTE_CREATED, { boardId: board._id, note });
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } finally { clearAuth(); navigate('/login'); }
  };

  const noteCount = getOrderedNotes().length;
  const zoomPct   = Math.round(vpState.zoom * 100);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      backgroundColor: '#1a1209',
    }}>

      {/* ── Cork board ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(160,110,40,0.55) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(120,80,25,0.45) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 50%, rgba(190,140,65,0.25) 0%, transparent 65%),
          #c49a45
        `,
      }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }}>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
        <div style={{
          position:'absolute', inset:'12px',
          boxShadow:'inset 0 0 80px rgba(0,0,0,0.4), inset 0 0 140px rgba(0,0,0,0.18)',
          borderRadius:'8px',
        }}/>
      </div>

      {/* ── Infinite canvas ── */}
      {board && !isLoading && (
        <InfiniteCanvas onViewportChange={handleViewportChange}>
          <div style={{ position:'relative', width:3000, height:2000 }}>
            <BoardCanvas boardId={board._id} />
            <CollabCursors />
          </div>
        </InfiniteCanvas>
      )}

      {/* ── 4 Corner pins — exact positions, never covered ── */}
      {pins.map((pin) => (
        <CornerPin
          key={pin.index}
          index={pin.index}
          inserted={pin.inserted}
          onRemove={() => {
            removePin(pin.index);
            if (board) emit(SOCKET_EVENTS.BOARD_LOCK, {
              boardId: board._id,
              isLocked: (removedCount + 1) < 4,
            });
          }}
          style={CORNER_STYLES[pin.index]}
        />
      ))}

      {/* ── Pin tray — sits above toolbar, left side, does NOT cover bottom pins ── */}
      <AnimatePresence>
        {removedCount > 0 && <PinTray />}
      </AnimatePresence>

      {/* ── Lock indicator ── */}
      <LockIndicator isLocked={isLocked} pinsRemaining={4 - removedCount} />

      {/* ── Collab modal ── */}
      <AnimatePresence>
        {collabOpen && board && (
          <CollabModal boardId={board._id} onClose={() => setCollabOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Search modal ── */}
      <AnimatePresence>
        {searchOpen && board && (
          <SearchModal
            boardId={board._id}
            onClose={() => setSearchOpen(false)}
            onJumpTo={(note) => {
              setVpState({
                x: -(note.x - window.innerWidth  / 2),
                y: -(note.y - window.innerHeight / 2),
                zoom: 1,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Templates modal ── */}
      <AnimatePresence>
        {tmplOpen && board && (
          <TemplatesModal boardId={board._id} onClose={() => setTmplOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Archive panel ── */}
      <AnimatePresence>
        {archiveOpen && board && (
          <ArchivePanel boardId={board._id} onClose={() => setArchiveOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Reminder toast ── */}
      <ReminderToast />

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
        }}>
          <div style={{
            background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)',
            borderRadius:'16px', padding:'20px 32px',
            fontSize:'14px', color:'#5a3e1b', fontWeight:500,
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            Loading your board…
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
          background:'#fff1f1', border:'1px solid #fca5a5', color:'#b91c1c',
          borderRadius:'12px', padding:'10px 20px', fontSize:'13px',
          zIndex:100, boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && board && noteCount === 0 && (
        <motion.div
          initial={{ opacity:0, scale:0.9 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.4 }}
          style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            pointerEvents:'none', zIndex:5,
          }}
        >
          <div style={{
            background:'rgba(255,255,255,0.78)', backdropFilter:'blur(16px)',
            borderRadius:'20px', padding:'32px 40px', textAlign:'center',
            boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
            border:'1px solid rgba(255,255,255,0.6)',
          }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📌</div>
            <div style={{ fontSize:'18px', fontWeight:600, color:'#5a3e1b', marginBottom:'6px' }}>
              Your board is empty
            </div>
            <div style={{ fontSize:'13px', color:'#9a7a50' }}>
              Click <strong>Add Note</strong> below to pin your first idea
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Top bar ── */}
      {board && !isLoading && (
        <div style={{
          position:'absolute', top:16, left:0, right:0,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 80px', zIndex:40, pointerEvents:'none',
        }}>
          <div style={{
            background:'rgba(255,255,255,0.78)', backdropFilter:'blur(12px)',
            borderRadius:'12px', padding:'8px 16px',
            boxShadow:'0 2px 12px rgba(0,0,0,0.15)',
            border:'1px solid rgba(255,255,255,0.55)',
          }}>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#5a3e1b' }}>{board.name}</div>
            <div style={{ fontSize:'11px', color:'#9a7a50' }}>
              {noteCount} note{noteCount !== 1 ? 's' : ''} · {zoomPct}% · {isLocked ? '🔒' : '🔓'}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', pointerEvents:'auto' }}>
            <CollabAvatars />
            <div style={{
              background:'rgba(255,255,255,0.78)', backdropFilter:'blur(12px)',
              borderRadius:'10px', padding:'6px 12px',
              fontSize:'12px', fontWeight:500, color:'#5a3e1b',
              boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
              display:'flex', alignItems:'center', gap:'8px',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                backgroundColor: user?.avatarColor || '#c49a45',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:'12px', fontWeight:700,
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              {user?.username}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom toolbar ── */}
      <motion.div
        initial={{ y:100, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ type:'spring', stiffness:260, damping:22, delay:0.2 }}
        style={{
          position:'absolute', bottom:24, left:'50%',
          transform:'translateX(-50%)', zIndex:60,
          background:'rgba(255,255,255,0.90)', backdropFilter:'blur(20px)',
          borderRadius:'24px', padding:'10px 20px',
          display:'flex', alignItems:'center', gap:'4px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          border:'1px solid rgba(255,255,255,0.7)',
          pointerEvents:'auto',
        }}
      >
        {/* Add Note */}
        <div style={{ position:'relative' }}>
          <ToolbarBtn
            icon={<Plus size={20}/>}
            label="Add Note"
            active={addOpen}
            onClick={() => setAddOpen(o => !o)}
          />
          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity:0, y:10, scale:0.92 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.94 }}
                transition={{ type:'spring', stiffness:380, damping:26 }}
                style={{
                  position:'absolute', bottom:'calc(100% + 12px)', left:'50%',
                  transform:'translateX(-50%)',
                  background:'rgba(255,255,255,0.98)', backdropFilter:'blur(16px)',
                  borderRadius:'18px', overflow:'hidden',
                  boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
                  border:'1px solid rgba(0,0,0,0.07)',
                  minWidth:'200px', zIndex:70,
                }}
              >
                {NOTE_TYPES.map(([type, meta]) => {
                  const col = NOTE_COLORS[meta.defaultColor];
                  return (
                    <button key={type} onClick={() => handleAddNote(type)}
                      style={{
                        width:'100%', display:'flex', alignItems:'center',
                        gap:'12px', padding:'11px 16px',
                        background:'transparent', border:'none', cursor:'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background='#f5f5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                    >
                      <span style={{
                        width:'32px', height:'32px', borderRadius:'8px',
                        backgroundColor:col.bg, border:`1px solid ${col.border}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'16px', flexShrink:0,
                      }}>{meta.icon}</span>
                      <span style={{ fontSize:'14px', fontWeight:500, color:'#333' }}>{meta.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider/>
        <ToolbarBtn icon={<Bell size={20}/>}   label="Reminder"  onClick={() => setArchiveOpen(true)} />
        <ToolbarBtn icon={<Search size={20}/>}  label="Search"    onClick={() => {}} />
        <Divider/>
        <ToolbarBtn
          icon={<ZoomIn size={20}/>}
          label={`${zoomPct}%`}
          onClick={() => setVpState(v => ({ ...v, zoom: Math.min(2.5, v.zoom + 0.1) }))}
        />
        <ToolbarBtn
          icon={<ZoomOut size={20}/>}
          label="Zoom Out"
          onClick={() => setVpState(v => ({ ...v, zoom: Math.max(0.3, v.zoom - 0.1) }))}
        />
        <Divider/>
        <ToolbarBtn
          icon={isLocked ? <Lock size={20}/> : <Unlock size={20}/>}
          label={isLocked ? 'Locked' : 'Unlocked'}
          active={!isLocked}
          onClick={() => {}}
          title="Remove all 4 corner pins to unlock"
        />
        <ToolbarBtn icon={<LayoutTemplate size={20}/>} label="Templates" onClick={() => setTmplOpen(true)} />
        <ToolbarBtn
          icon={<Users size={20}/>}
          label="Collab"
          onClick={() => setCollabOpen(true)}
        />
        <Divider/>
        <ToolbarBtn icon={<LogOut size={20}/>} label="Logout" onClick={handleLogout} danger />
      </motion.div>

      {addOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:55 }}
             onClick={() => setAddOpen(false)} />
      )}
    </div>
  );
}

function ToolbarBtn({
  icon, label, onClick, active=false, danger=false, title,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  active?: boolean; danger?: boolean; title?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        gap:'3px', padding:'8px 12px', borderRadius:'14px', border:'none',
        background: active ? 'rgba(196,154,69,0.18)' : hov ? 'rgba(0,0,0,0.05)' : 'transparent',
        cursor:'pointer', minWidth:'52px', transition:'all 0.15s',
        color: danger ? (hov ? '#dc2626' : '#ef4444') : active ? '#5a3e1b' : '#444',
      }}
    >
      {icon}
      <span style={{ fontSize:'10px', fontWeight:500, whiteSpace:'nowrap' }}>{label}</span>
    </button>
  );
}

function Divider() {
  return <div style={{
    width:'1px', height:'36px', background:'rgba(0,0,0,0.1)',
    margin:'0 4px', flexShrink:0,
  }}/>;
}