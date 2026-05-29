import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { BoardCanvas }         from '@/components/board/BoardCanvas';
import { InfiniteCanvas, type Viewport } from '@/components/board/InfiniteCanvas';
import { LockIndicator }       from '@/components/board/LockIndicator';
import { BoardStabilityWidget } from '@/components/board/BoardStabilityWidget';
import { NoteMapModal }        from '@/components/board/NoteMapModal';
import { ClearBoardModal }     from '@/components/board/ClearBoardModal';
import { CornerPin }           from '@/components/pins/CornerPin';
import { PinTray }             from '@/components/pins/PinTray';
import { CollabAvatars }       from '@/components/collab/CollabAvatars';
import { CollabCursors }       from '@/components/collab/CollabCursors';
import { CollabModal }         from '@/components/collab/CollabModal';
import { SearchModal }         from '@/components/search/SearchModal';
import { TemplatesModal }      from '@/components/templates/TemplatesModal';
import { ArchivePanel }        from '@/components/archive/ArchivePanel';
import { ReminderToast }       from '@/components/reminders/ReminderToast';
import { useReminders }        from '@/hooks/useReminders';

import { useAuthStore }        from '@/stores/auth.store';
import { useNoteStore }        from '@/stores/note.store';
import { useBoardStore, type CornerIndex } from '@/stores/board.store';

import { boardApi }            from '@/services/boardApi';
import { authApi }             from '@/services/api';
import { useSocket }           from '@/hooks/useSocket';
import { SOCKET_EVENTS }       from '@/lib/socketEvents';
import { NOTE_TYPE_META, NOTE_COLORS } from '@/lib/noteColors';
import type { NoteType, NoteColor, Note } from '@/types/note.types';

import {
  Plus, Search, ZoomIn, ZoomOut, Lock, Unlock,
  LayoutTemplate, LogOut,
  Trash2, Map, ChevronDown, Share2, Activity,
} from 'lucide-react';
import { createPortal } from 'react-dom';

/* ── types ── */
const NOTE_TYPES = Object.entries(NOTE_TYPE_META) as [NoteType, typeof NOTE_TYPE_META[NoteType]][];

const CORNER_STYLES: Record<CornerIndex, React.CSSProperties> = {
  0: { top: 10, left: 10 },
  1: { top: 10, right: 10 },
  2: { bottom: 104, left: 10 },
  3: { bottom: 104, right: 10 },
};

/* ── wobble keyframes injected once ── */
const WOBBLE_CSS = `
@keyframes boardWobble {
  0%,100% { transform: rotate(0deg); }
  20%     { transform: rotate(-0.15deg); }
  40%     { transform: rotate(0.12deg); }
  60%     { transform: rotate(-0.10deg); }
  80%     { transform: rotate(0.08deg); }
}
@keyframes boardShake {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  15%     { transform: translate(-1px,-1px) rotate(-0.2deg); }
  30%     { transform: translate(1px,0px) rotate(0.15deg); }
  50%     { transform: translate(-1px,1px) rotate(-0.12deg); }
  70%     { transform: translate(1px,-1px) rotate(0.10deg); }
  85%     { transform: translate(-1px,0px) rotate(-0.08deg); }
}
`;

export default function BoardPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedBoardId  = searchParams.get('id');

  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { setBoard, setNotes, board, getOrderedNotes, isLoading, setLoading, addNote } = useNoteStore();
  const { isLocked, pins, removedCount, initPins, removePin } = useBoardStore();

  const [error,        setError]        = useState('');
  const [addOpen,      setAddOpen]      = useState(false);
  const [typesOpen,    setTypesOpen]    = useState(false);
  const [collabOpen,   setCollabOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [tmplOpen,     setTmplOpen]     = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [mapOpen,      setMapOpen]      = useState(false);
  const [clearOpen,    setClearOpen]    = useState(false);

  /* controlled viewport */
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  const { emit }    = useSocket(board?._id ?? null);
  const vpSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useReminders();

  /* inject wobble CSS once */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = WOBBLE_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  /* Cmd+K */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── init ── */
  const initBoard = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      let target;
      if (sharedBoardId) {
        try { target = await boardApi.getBoard(sharedBoardId); }
        catch {
          setError('Shared board not found — loading your own board.');
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

  /* viewport */
  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewport(vp);
    clearTimeout(vpSaveTimer.current);
    vpSaveTimer.current = setTimeout(() => {
      if (board) boardApi.updateViewport(board._id, vp.x, vp.y, vp.zoom).catch(() => {});
    }, 800);
  }, [board]);

  /* toolbar zoom */
  const zoomBy = useCallback((delta: number) => {
    if (isLocked) return;
    setViewport((v) => {
      const nextZoom = Math.min(3.0, Math.max(0.2, v.zoom + delta));
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const scale = nextZoom / v.zoom;
      const next = { x: cx - scale * (cx - v.x), y: cy - scale * (cy - v.y), zoom: nextZoom };
      clearTimeout(vpSaveTimer.current);
      vpSaveTimer.current = setTimeout(() => {
        if (board) boardApi.updateViewport(board._id, next.x, next.y, next.zoom).catch(() => {});
      }, 600);
      return next;
    });
  }, [isLocked, board]);

  /* add note */
  const handleAddNote = async (type: NoteType) => {
    setAddOpen(false); setTypesOpen(false);
    if (!board) return;
    const color: NoteColor = NOTE_TYPE_META[type].defaultColor;
    const x = (-viewport.x / viewport.zoom) + (window.innerWidth  / viewport.zoom / 2) - 110;
    const y = (-viewport.y / viewport.zoom) + (window.innerHeight / viewport.zoom / 2) - 110;
    try {
      const note = await boardApi.createNote(board._id, {
        type, color, x: Math.max(20, x), y: Math.max(20, y),
      });
      addNote(note);
      emit(SOCKET_EVENTS.NOTE_CREATED, { boardId: board._id, note });
    } catch (e) { console.error(e); }
  };

  /* jump to note */
  const jumpToNote = useCallback((note: Note) => {
    if (isLocked) return;
    setViewport((v) => ({
      x: window.innerWidth  / 2 - (note.x + note.width  / 2) * v.zoom,
      y: window.innerHeight / 2 - (note.y + note.height / 2) * v.zoom,
      zoom: v.zoom,
    }));
  }, [isLocked]);

  /* clear board */
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

  /* board wobble intensity based on removed pins */
  const wobbleAnim = removedCount === 0
    ? 'none'
    : removedCount === 1
    ? 'boardWobble 8s ease-in-out infinite'
    : removedCount === 2
    ? 'boardWobble 4s ease-in-out infinite'
    : removedCount >= 3
    ? 'boardShake 3s ease-in-out infinite'
    : 'none';

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#1a1209' }}>

      {/* ── Cork board with wobble ── */}
      <div style={{
        position: 'absolute', inset: 0,
        animation: wobbleAnim,
        background: `
          radial-gradient(ellipse at 30% 25%, rgba(200,155,70,0.70) 0%, transparent 40%),
          radial-gradient(ellipse at 75% 70%, rgba(140,95,30,0.60) 0%, transparent 40%),
          radial-gradient(ellipse at 10% 80%, rgba(160,110,40,0.40) 0%, transparent 35%),
          radial-gradient(ellipse at 90% 10%, rgba(180,130,50,0.35) 0%, transparent 35%),
          #b8874a
        `,
      }}>
        {/* Cork grain SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14 }}>
          <filter id="board-cork-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#board-cork-noise)"/>
        </svg>
        {/* Deep inset edge shadow — gives the board depth */}
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.45), inset 0 0 60px rgba(0,0,0,0.20)',
          pointerEvents: 'none',
        }}/>
      </div>

      {/* ── Infinite canvas ── */}
      {board && !isLoading && (
        <InfiniteCanvas viewport={viewport} onViewportChange={handleViewportChange}>
          <div style={{ position: 'relative', width: 3000, height: 2000 }}>
            <BoardCanvas boardId={board._id} />
            <CollabCursors />
          </div>
        </InfiniteCanvas>
      )}

      {/* ── Corner pins ── */}
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

      {/* ── Pin tray ── */}
      <AnimatePresence>{removedCount > 0 && <PinTray />}</AnimatePresence>

      {/* ── Stability widget (bottom right) ── */}
      <BoardStabilityWidget />

      {/* ── Lock indicator (top center) ── */}
      <LockIndicator />

      {/* ── All modals ── */}
      <AnimatePresence>
        {collabOpen  && board && <CollabModal    boardId={board._id} onClose={() => setCollabOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {searchOpen  && board && <SearchModal    boardId={board._id} onClose={() => setSearchOpen(false)} onJumpTo={jumpToNote} />}
      </AnimatePresence>
      <AnimatePresence>
        {tmplOpen    && board && <TemplatesModal boardId={board._id} onClose={() => setTmplOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {archiveOpen && board && <ArchivePanel   boardId={board._id} onClose={() => setArchiveOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {mapOpen               && <NoteMapModal  onClose={() => setMapOpen(false)} onJumpTo={jumpToNote} />}
      </AnimatePresence>
      <AnimatePresence>
        {clearOpen             && <ClearBoardModal noteCount={noteCount} onConfirm={handleClearBoard} onClose={() => setClearOpen(false)} />}
      </AnimatePresence>

      <ReminderToast />

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px 32px', fontSize: '14px', color: '#5a3e1b', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.20)' }}>
            Loading board…
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', background: '#fff1f1', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', whiteSpace: 'nowrap' }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && board && noteCount === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '36px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.65)' }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>📌</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3d2e00', marginBottom: '8px' }}>
              {sharedBoardId ? board.name : 'Your board is empty'}
            </div>
            <div style={{ fontSize: '14px', color: '#8a6a30' }}>
              {sharedBoardId ? 'Shared board — add notes below!' : 'Click Add Note in the toolbar below'}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════
          TOP BAR — matches reference exactly
          Left: board name card
          Center: (stability badge handled by LockIndicator)
          Right: collab avatars + Share button + user
      ══════════════════════════════════════════════ */}
      {board && !isLoading && (
        <div style={{
          position: 'absolute', top: 12, left: 0, right: 0,
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '0 72px',
          zIndex: 40,
          pointerEvents: 'none',
        }}>
          {/* Board name card */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px',
              padding: '10px 16px 10px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.10)',
              border: '1px solid rgba(255,255,255,0.65)',
              pointerEvents: 'auto',
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>
                {board.name}
              </div>
              {sharedBoardId && (
                <span style={{ fontSize: '10px', background: 'rgba(196,154,69,0.18)', color: '#8a6a30', padding: '2px 7px', borderRadius: '8px', fontWeight: 600 }}>
                  shared
                </span>
              )}
              <ChevronDown size={13} color="#aaa"/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Mini collab avatars in card */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: user?.avatarColor || '#c49a45',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '9px', fontWeight: 700,
                  border: '1.5px solid white',
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
                {user?.username} · Team Workspace
              </span>
            </div>
          </motion.div>

          {/* Right side — collab avatars + Share + user pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}
          >
            {/* Collab avatars */}
            <CollabAvatars />

            {/* Share button — reference has this */}
            <button
              onClick={() => setCollabOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.90)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.65)',
                borderRadius: '22px',
                fontSize: '13px', fontWeight: 600, color: '#1a1a1a',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              }}
            >
              <Share2 size={14} />
              Share
            </button>

            {/* User pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(14px)',
              borderRadius: '22px', padding: '5px 12px 5px 5px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.65)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: user?.avatarColor || '#c49a45',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '12px', fontWeight: 700,
                boxShadow: '0 1px 4px rgba(0,0,0,0.20)',
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                {user?.username}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          BOTTOM TOOLBAR — reference faithful
          White pill, icon + label, zoom circle dial center
      ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.25 }}
        style={{
          position: 'absolute', bottom: 20, left: '50%',
          transform: 'translateX(-50%)', zIndex: 60,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '52px',
          padding: '10px 22px',
          display: 'flex', alignItems: 'center', gap: '0px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
          pointerEvents: 'auto',
        }}
      >
        {/* Add Note */}
        <div style={{ position: 'relative' }}>
          <TBtn icon={<Plus size={22} strokeWidth={2}/>} label="Add Note"
            active={addOpen} onClick={() => { setAddOpen(o => !o); setTypesOpen(false); }} />
          <AnimatePresence>
            {addOpen && (
              <NoteTypeMenu types={NOTE_TYPES} onSelect={handleAddNote} />
            )}
          </AnimatePresence>
        </div>

        {/* Note Types */}
        <div style={{ position: 'relative' }}>
          <TBtn icon={<LayoutTemplate size={22}/>} label="Note Types"
            active={typesOpen} onClick={() => { setTypesOpen(o => !o); setAddOpen(false); }} />
          <AnimatePresence>
            {typesOpen && (
              <NoteTypeMenu types={NOTE_TYPES} onSelect={handleAddNote} />
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <TBtn icon={<Search size={22}/>} label="Search" onClick={() => setSearchOpen(true)} />

        <TSep />

        {/* Zoom Out */}
        <TBtn icon={<ZoomOut size={22}/>} label="Zoom Out"
          onClick={() => zoomBy(-0.15)}
          disabled={isLocked}
          title={isLocked ? 'Remove pins to zoom' : 'Zoom out'} />

        {/* Zoom dial — circular progress indicator matching reference */}
        <ZoomDial pct={zoomPct} isLocked={isLocked} onClick={() => zoomBy(0)} />

        {/* Zoom In */}
        <TBtn icon={<ZoomIn size={22}/>} label="Zoom In"
          onClick={() => zoomBy(+0.15)}
          disabled={isLocked}
          title={isLocked ? 'Remove pins to zoom' : 'Zoom in'} />

        <TSep />

        {/* Board Lock */}
        <TBtn
          icon={isLocked ? <Lock size={22}/> : <Unlock size={22}/>}
          label="Board Lock"
          active={!isLocked}
          onClick={() => {}}
          title="Remove all 4 corner pins to unlock"
        />

        {/* Templates */}
        <TBtn icon={<LayoutTemplate size={22}/>} label="Templates" onClick={() => setTmplOpen(true)} />

        {/* Activity / Archive */}
        <TBtn icon={<Activity size={22}/>} label="Activity" onClick={() => setArchiveOpen(true)} />

        {/* More actions menu */}
        <TSep />

        <TBtn icon={<Map size={22}/>}   label="Map"   onClick={() => setMapOpen(true)} />
        <TBtn icon={<Trash2 size={22}/>} label="Clear"
          onClick={() => noteCount > 0 && setClearOpen(true)}
          disabled={noteCount === 0} danger
          title={noteCount === 0 ? 'Board is empty' : `Archive all ${noteCount} notes`} />
        <TBtn icon={<LogOut size={22}/>} label="Logout" onClick={handleLogout} danger />
      </motion.div>

      {/* ── Tip bar — bottom, below toolbar ── */}
      <AnimatePresence>
        {board && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              zIndex: 50, padding: '4px 0 6px',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.50)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {isLocked
                ? `ⓘ  Remove all 4 pins to move the board  ·  ${noteCount} note${noteCount !== 1 ? 's' : ''}`
                : `ⓘ  Board unlocked — scroll or drag to pan  ·  ${zoomPct}%`
              }
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close menus on outside click */}
      {(addOpen || typesOpen) && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 55 }}
             onClick={() => { setAddOpen(false); setTypesOpen(false); }} />,
        document.body
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Toolbar sub-components
══════════════════════════════════════════ */

/* Regular toolbar button */
function TBtn({
  icon, label, onClick, active = false,
  danger = false, disabled = false, title,
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
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', padding: '8px 10px', borderRadius: '16px', border: 'none',
        background: active
          ? 'rgba(184,135,74,0.15)'
          : hov && !disabled ? 'rgba(0,0,0,0.05)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth: '52px', transition: 'background 0.14s',
        opacity: disabled ? 0.30 : 1,
        color: danger
          ? (hov && !disabled ? '#dc2626' : '#ef4444')
          : active ? '#5a3e1b' : '#1a1a1a',
      }}
    >
      {icon}
      <span style={{
        fontSize: '10px', fontWeight: 500,
        whiteSpace: 'nowrap', letterSpacing: '0.01em',
        fontFamily: 'Inter, sans-serif',
        color: danger
          ? (hov && !disabled ? '#dc2626' : '#ef4444')
          : active ? '#5a3e1b' : '#555',
      }}>
        {label}
      </span>
    </button>
  );
}

/* Separator */
function TSep() {
  return (
    <div style={{
      width: 1, height: 38,
      background: 'rgba(0,0,0,0.08)',
      margin: '0 4px', flexShrink: 0,
    }}/>
  );
}

/* Zoom dial — circular SVG progress matching reference */
function ZoomDial({ pct, isLocked, onClick }: { pct: number; isLocked: boolean; onClick: () => void }) {
  const r   = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <button
      onClick={onClick}
      title={`${pct}% zoom`}
      style={{
        position: 'relative', width: 56, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'default',
        padding: 0, flexShrink: 0,
      }}
    >
      <svg width="56" height="56" style={{ position: 'absolute', inset: 0 }}>
        {/* Track */}
        <circle cx="28" cy="28" r={r}
          fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3"/>
        {/* Progress */}
        <circle cx="28" cy="28" r={r}
          fill="none"
          stroke={isLocked ? '#d0a060' : '#1a1a1a'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}   /* start at top */
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      </svg>
      {/* Label */}
      <div style={{
        position: 'relative',
        fontSize: '11px', fontWeight: 700,
        color: isLocked ? '#d0a060' : '#1a1a1a',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1,
        textAlign: 'center',
      }}>
        {pct}
        <div style={{ fontSize: '8px', fontWeight: 500, color: '#888', marginTop: '1px' }}>%</div>
      </div>
    </button>
  );
}

/* Note type picker menu */
function NoteTypeMenu({
  types,
  onSelect,
}: {
  types: [NoteType, typeof NOTE_TYPE_META[NoteType]][];
  onSelect: (t: NoteType) => void;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{   opacity: 0, y: 8,   scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        position: 'fixed',
        bottom: 108, left: '50%',
        transform: 'translateX(-15%)',  /* align under Add Note */
        zIndex: 9000,
        background: 'rgba(255,255,255,0.99)',
        backdropFilter: 'blur(20px)',
        borderRadius: '18px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        minWidth: 210,
      }}
    >
      {types.map(([type, meta]) => {
        const col = NOTE_COLORS[meta.defaultColor];
        return (
          <button key={type} onClick={() => onSelect(type)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '12px', padding: '11px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f4f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{
              width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
              backgroundColor: col.bg, border: `1px solid ${col.shadow}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>
              {meta.icon}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>
                {meta.label}
              </div>
              <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
                {type === 'normal' ? 'Plain sticky note' :
                 type === 'task'   ? 'Checklist note' :
                 type === 'reminder' ? 'With reminder bell' :
                 type === 'urgent' ? 'High priority' : 'Idea capture'}
              </div>
            </div>
          </button>
        );
      })}
    </motion.div>,
    document.body
  );
}
