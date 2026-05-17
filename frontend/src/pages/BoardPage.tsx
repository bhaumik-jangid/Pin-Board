import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { BoardCanvas }      from '@/components/board/BoardCanvas';
import { InfiniteCanvas, type Viewport } from '@/components/board/InfiniteCanvas';
import { LockIndicator }    from '@/components/board/LockIndicator';
import { NoteMapModal }     from '@/components/board/NoteMapModal';
import { ClearBoardModal }  from '@/components/board/ClearBoardModal';
import { CornerPin }        from '@/components/pins/CornerPin';
import { PinTray }          from '@/components/pins/PinTray';
import { CollabAvatars }    from '@/components/collab/CollabAvatars';
import { CollabCursors }    from '@/components/collab/CollabCursors';
import { CollabModal }      from '@/components/collab/CollabModal';
import { SearchModal }      from '@/components/search/SearchModal';
import { TemplatesModal }   from '@/components/templates/TemplatesModal';
import { ArchivePanel }     from '@/components/archive/ArchivePanel';
import { ReminderToast }    from '@/components/reminders/ReminderToast';
import { useReminders }     from '@/hooks/useReminders';

import { useAuthStore }     from '@/stores/auth.store';
import { useNoteStore }     from '@/stores/note.store';
import { useBoardStore, type CornerIndex } from '@/stores/board.store';

import { boardApi }         from '@/services/boardApi';
import { authApi }          from '@/services/api';
import { useSocket }        from '@/hooks/useSocket';
import { SOCKET_EVENTS }    from '@/lib/socketEvents';
import { NOTE_TYPE_META, NOTE_COLORS } from '@/lib/noteColors';
import type { NoteType, NoteColor, Note } from '@/types/note.types';

import {
  Plus, Bell, Search, ZoomIn, ZoomOut,
  Lock, Unlock, LayoutTemplate, Users,
  LogOut, Archive, Trash2, Map,
} from 'lucide-react';

const NOTE_TYPES = Object.entries(NOTE_TYPE_META) as [NoteType, typeof NOTE_TYPE_META[NoteType]][];

const CORNER_STYLES: Record<CornerIndex, React.CSSProperties> = {
  0: { top: 16,     left:  16 },
  1: { top: 16,     right: 16 },
  2: { bottom: 108, left:  16 },
  3: { bottom: 108, right: 16 },
};

export default function BoardPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedBoardId  = searchParams.get('id');

  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { setBoard, setNotes, board, getOrderedNotes, isLoading, setLoading, addNote } = useNoteStore();
  const { isLocked, pins, removedCount, initPins, removePin } = useBoardStore();

  /* ── UI state ── */
  const [error,        setError]        = useState('');
  const [addOpen,      setAddOpen]      = useState(false);
  const [collabOpen,   setCollabOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [tmplOpen,     setTmplOpen]     = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [mapOpen,      setMapOpen]      = useState(false);
  const [clearOpen,    setClearOpen]    = useState(false);

  /*
    Single controlled viewport — both InfiniteCanvas and toolbar
    zoom buttons read/write the same object.
  */
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  const { emit } = useSocket(board?._id ?? null);
  const vpSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useReminders();

  /* Cmd+K */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── Init board ── */
  const initBoard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      let target;
      if (sharedBoardId) {
        try { target = await boardApi.getBoard(sharedBoardId); }
        catch {
          setError('Shared board not found — loading your board.');
          const bs = await boardApi.getMyBoards();
          target = bs.length ? bs[0] : await boardApi.createBoard(`${user.username}'s Board`);
        }
      } else {
        const bs = await boardApi.getMyBoards();
        target = bs.length ? bs[0] : await boardApi.createBoard(`${user.username}'s Board`);
      }
      setBoard(target);
      setNotes(await boardApi.getNotes(target._id));
    } catch (e) {
      console.error(e);
      setError('Could not reach board-service on port 3002.');
    } finally { setLoading(false); }
  }, [user, sharedBoardId, setBoard, setNotes, setLoading]);

  useEffect(() => { initBoard(); initPins(); }, [initBoard, initPins]);

  /* ── Viewport: from InfiniteCanvas (pan/wheel) ── */
  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewport(vp);
    clearTimeout(vpSaveTimer.current);
    vpSaveTimer.current = setTimeout(() => {
      if (board) boardApi.updateViewport(board._id, vp.x, vp.y, vp.zoom).catch(() => {});
    }, 800);
  }, [board]);

  /* ── Zoom toolbar buttons — respect lock ── */
  const zoomBy = useCallback((delta: number) => {
    if (isLocked) return;
    setViewport((v) => {
      const nextZoom = Math.min(3.0, Math.max(0.2, v.zoom + delta));
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const scale = nextZoom / v.zoom;
      const next = {
        x: cx - scale * (cx - v.x),
        y: cy - scale * (cy - v.y),
        zoom: nextZoom,
      };
      /* Also persist */
      clearTimeout(vpSaveTimer.current);
      vpSaveTimer.current = setTimeout(() => {
        if (board) boardApi.updateViewport(board._id, next.x, next.y, next.zoom).catch(() => {});
      }, 600);
      return next;
    });
  }, [isLocked, board]);

  /* ── Add note at viewport center ── */
  const handleAddNote = async (type: NoteType) => {
    setAddOpen(false);
    if (!board) return;
    const color: NoteColor = NOTE_TYPE_META[type].defaultColor;
    const x = (-viewport.x / viewport.zoom) + (window.innerWidth  / viewport.zoom / 2) - 100;
    const y = (-viewport.y / viewport.zoom) + (window.innerHeight / viewport.zoom / 2) - 100;
    try {
      const note = await boardApi.createNote(board._id, {
        type, color, x: Math.max(20, x), y: Math.max(20, y),
      });
      addNote(note);
      emit(SOCKET_EVENTS.NOTE_CREATED, { boardId: board._id, note });
    } catch (e) { console.error(e); }
  };

  /* ── Jump to note (from Map or Search) ── */
  const jumpToNote = useCallback((note: Note) => {
    if (isLocked) return; /* can't pan when locked */
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    setViewport((v) => ({
      x: cx - (note.x + note.width  / 2) * v.zoom,
      y: cy - (note.y + note.height / 2) * v.zoom,
      zoom: v.zoom,
    }));
  }, [isLocked]);

  /* ── Clear board ── */
  const handleClearBoard = async () => {
    if (!board) return;
    const all = getOrderedNotes();
    setClearOpen(false);
    try {
      await Promise.all(all.map((n) => boardApi.deleteNote(board._id, n._id)));
      setNotes([]);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } finally { clearAuth(); navigate('/login'); }
  };

  const noteCount = getOrderedNotes().length;
  const zoomPct   = Math.round(viewport.zoom * 100);

  return (
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', position:'relative', backgroundColor:'#1a1209' }}>

      {/* Cork board */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:`
          radial-gradient(ellipse at 15% 20%, rgba(160,110,40,0.55) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(120,80,25,0.45) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 50%, rgba(190,140,65,0.25) 0%, transparent 65%),
          #c49a45`,
      }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }}>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
        <div style={{ position:'absolute', inset:'12px', borderRadius:'8px',
          boxShadow:'inset 0 0 80px rgba(0,0,0,0.4), inset 0 0 140px rgba(0,0,0,0.18)' }}/>
      </div>

      {/* Infinite canvas */}
      {board && !isLoading && (
        <InfiniteCanvas viewport={viewport} onViewportChange={handleViewportChange}>
          <div style={{ position:'relative', width:3000, height:2000 }}>
            <BoardCanvas boardId={board._id} />
            <CollabCursors />
          </div>
        </InfiniteCanvas>
      )}

      {/* Corner pins */}
      {pins.map((pin) => (
        <CornerPin key={pin.index} index={pin.index} inserted={pin.inserted}
          onRemove={() => {
            removePin(pin.index);
            if (board) emit(SOCKET_EVENTS.BOARD_LOCK, {
              boardId: board._id, isLocked: (removedCount + 1) < 4,
            });
          }}
          style={CORNER_STYLES[pin.index]}
        />
      ))}

      <AnimatePresence>{removedCount > 0 && <PinTray />}</AnimatePresence>
      <LockIndicator isLocked={isLocked} pinsRemaining={4 - removedCount} />

      {/* All modals via portals */}
      <AnimatePresence>
        {collabOpen  && board && <CollabModal   boardId={board._id} onClose={() => setCollabOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {searchOpen  && board && <SearchModal   boardId={board._id} onClose={() => setSearchOpen(false)}  onJumpTo={jumpToNote} />}
      </AnimatePresence>
      <AnimatePresence>
        {tmplOpen    && board && <TemplatesModal boardId={board._id} onClose={() => setTmplOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {archiveOpen && board && <ArchivePanel   boardId={board._id} onClose={() => setArchiveOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {mapOpen     && <NoteMapModal onClose={() => setMapOpen(false)} onJumpTo={jumpToNote} />}
      </AnimatePresence>
      <AnimatePresence>
        {clearOpen   && <ClearBoardModal noteCount={noteCount} onConfirm={handleClearBoard} onClose={() => setClearOpen(false)} />}
      </AnimatePresence>

      <ReminderToast />

      {/* Loading */}
      {isLoading && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)',
            borderRadius:'16px', padding:'20px 32px', fontSize:'14px', color:'#5a3e1b', fontWeight:500,
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            Loading board…
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
          background:'#fff1f1', border:'1px solid #fca5a5', color:'#b91c1c',
          borderRadius:'12px', padding:'10px 20px', fontSize:'13px',
          zIndex:100, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', whiteSpace:'nowrap' }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && board && noteCount === 0 && (
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.4 }} style={{ position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            pointerEvents:'none', zIndex:5 }}>
          <div style={{ background:'rgba(255,255,255,0.78)', backdropFilter:'blur(16px)',
            borderRadius:'20px', padding:'32px 40px', textAlign:'center',
            boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📌</div>
            <div style={{ fontSize:'18px', fontWeight:600, color:'#5a3e1b', marginBottom:'6px' }}>
              {sharedBoardId ? board.name : 'Your board is empty'}
            </div>
            <div style={{ fontSize:'13px', color:'#9a7a50' }}>
              {sharedBoardId ? 'Shared board — add notes below!' : 'Click Add Note below to get started'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Top bar */}
      {board && !isLoading && (
        <div style={{ position:'absolute', top:16, left:0, right:0,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 80px', zIndex:40, pointerEvents:'none' }}>
          <div style={{ background:'rgba(255,255,255,0.78)', backdropFilter:'blur(12px)',
            borderRadius:'12px', padding:'8px 16px',
            boxShadow:'0 2px 12px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.55)' }}>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#5a3e1b' }}>
              {board.name}
              {sharedBoardId && (
                <span style={{ marginLeft:'8px', fontSize:'10px', background:'rgba(196,154,69,0.18)',
                  color:'#9a7a50', padding:'2px 6px', borderRadius:'6px' }}>shared</span>
              )}
            </div>
            <div style={{ fontSize:'11px', color:'#9a7a50' }}>
              {noteCount} note{noteCount !== 1 ? 's' : ''} · {zoomPct}% · {isLocked ? '🔒 locked' : '🔓 unlocked'}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', pointerEvents:'auto' }}>
            <CollabAvatars />
            <div style={{ background:'rgba(255,255,255,0.78)', backdropFilter:'blur(12px)',
              borderRadius:'10px', padding:'6px 12px', fontSize:'12px', fontWeight:500,
              color:'#5a3e1b', boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
              display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:28, height:28, borderRadius:'50%',
                backgroundColor: user?.avatarColor || '#c49a45',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:'12px', fontWeight:700 }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              {user?.username}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom toolbar — ALL buttons labelled + wired ── */}
      <motion.div
        initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }}
        transition={{ type:'spring', stiffness:260, damping:22, delay:0.2 }}
        style={{
          position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)',
          zIndex:60, display:'flex', alignItems:'center', gap:'2px',
          background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)',
          borderRadius:'24px', padding:'8px 14px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          border:'1px solid rgba(255,255,255,0.7)', pointerEvents:'auto',
        }}
      >

        {/* Add Note */}
        <div style={{ position:'relative' }}>
          <Btn icon={<Plus size={18}/>} label="Add Note" active={addOpen}
            onClick={() => setAddOpen(o => !o)} />
          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity:0, y:10, scale:0.92 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.94 }}
                transition={{ type:'spring', stiffness:380, damping:26 }}
                style={{ position:'absolute', bottom:'calc(100% + 10px)', left:'50%',
                  transform:'translateX(-50%)',
                  background:'rgba(255,255,255,0.98)', backdropFilter:'blur(16px)',
                  borderRadius:'16px', overflow:'hidden',
                  boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
                  border:'1px solid rgba(0,0,0,0.07)', minWidth:'190px', zIndex:70 }}>
                {NOTE_TYPES.map(([type, meta]) => {
                  const col = NOTE_COLORS[meta.defaultColor];
                  return (
                    <button key={type} onClick={() => handleAddNote(type)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px',
                        padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background='#f5f5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                      <span style={{ width:'28px', height:'28px', borderRadius:'7px',
                        backgroundColor:col.bg, border:`1px solid ${col.border}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'14px', flexShrink:0 }}>{meta.icon}</span>
                      <span style={{ fontSize:'13px', fontWeight:500, color:'#333' }}>{meta.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Sep/>
        {/* Search — ✅ */}
        <Btn icon={<Search size={18}/>}   label="Search"     onClick={() => setSearchOpen(true)} />
        {/* Map — ✅ NEW */}
        <Btn icon={<Map size={18}/>}       label="Map"        onClick={() => setMapOpen(true)} />
        <Sep/>
        {/*
          Zoom In/Out — ✅ NOW CONNECTED to controlled viewport.
          Shows current zoom %. Greyed when locked.
        */}
        <Btn
          icon={<ZoomIn size={18}/>}
          label={`${zoomPct}%`}
          onClick={() => zoomBy(+0.15)}
          disabled={isLocked}
          title={isLocked ? 'Remove pins to zoom' : 'Zoom in'}
        />
        <Btn
          icon={<ZoomOut size={18}/>}
          label="Zoom Out"
          onClick={() => zoomBy(-0.15)}
          disabled={isLocked}
          title={isLocked ? 'Remove pins to zoom' : 'Zoom out'}
        />
        <Sep/>
        {/* Lock indicator — display only, tooltip explains */}
        <Btn
          icon={isLocked ? <Lock size={18}/> : <Unlock size={18}/>}
          label={isLocked ? 'Locked' : 'Unlocked'}
          active={!isLocked}
          onClick={() => {}}
          title="Remove all 4 corner pins to unlock pan/zoom"
        />
        {/* Templates — ✅ */}
        <Btn icon={<LayoutTemplate size={18}/>} label="Templates" onClick={() => setTmplOpen(true)} />
        {/* Collab — ✅ */}
        <Btn icon={<Users size={18}/>}           label="Collab"    onClick={() => setCollabOpen(true)} />
        {/* Archive — ✅ */}
        <Btn icon={<Archive size={18}/>}          label="Archive"   onClick={() => setArchiveOpen(true)} />
        {/* Reminder — ✅ */}
        <Btn icon={<Bell size={18}/>}             label="Reminder"  onClick={() => setArchiveOpen(true)} />
        <Sep/>
        {/* Clear board — ✅ NEW */}
        <Btn
          icon={<Trash2 size={18}/>}
          label="Clear"
          onClick={() => noteCount > 0 && setClearOpen(true)}
          danger
          disabled={noteCount === 0}
          title={noteCount === 0 ? 'Board is already empty' : `Delete all ${noteCount} notes`}
        />
        {/* Logout — ✅ */}
        <Btn icon={<LogOut size={18}/>} label="Logout" onClick={handleLogout} danger />
      </motion.div>

      {addOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:55 }}
             onClick={() => setAddOpen(false)} />
      )}
    </div>
  );
}

/* ── Toolbar button ── */
function Btn({
  icon, label, onClick, active=false, danger=false,
  disabled=false, title,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  active?: boolean; danger?: boolean; disabled?: boolean; title?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        gap:'2px', padding:'7px 9px', borderRadius:'13px', border:'none',
        background: active
          ? 'rgba(196,154,69,0.18)'
          : hov && !disabled ? 'rgba(0,0,0,0.05)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth:'44px', transition:'all 0.14s',
        opacity: disabled ? 0.35 : 1,
        color: danger
          ? (hov && !disabled ? '#dc2626' : '#ef4444')
          : active ? '#5a3e1b' : disabled ? '#aaa' : '#444',
      }}
    >
      {icon}
      <span style={{ fontSize:'9px', fontWeight:600, whiteSpace:'nowrap',
        letterSpacing:'0.01em' }}>
        {label}
      </span>
    </button>
  );
}

function Sep() {
  return <div style={{ width:'1px', height:'32px', background:'rgba(0,0,0,0.08)',
    margin:'0 2px', flexShrink:0 }}/>;
}
