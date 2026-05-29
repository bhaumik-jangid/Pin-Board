import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import type { Note, NoteColor, TaskItem } from '@/types/note.types';
import { NOTE_COLORS } from '@/lib/noteColors';
import { NoteToolbar } from './NoteToolbar';
import { TaskList } from './TaskList';
import { useNoteStore } from '@/stores/note.store';
import { boardApi } from '@/services/boardApi';
import { socketEmit } from '@/lib/socketEmit';
import { SOCKET_EVENTS } from '@/lib/socketEvents';

interface Props {
  note: Note;
  boardId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function StickyNote({ note, boardId, isSelected, onSelect }: Props) {
  const { updateNote, removeNote, addNote } = useNoteStore();
  const colors = NOTE_COLORS[note.color];
  // const meta   = NOTE_TYPE_META[note.type];

  const [isHovered,   setIsHovered]   = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [content,     setContent]     = useState(note.content);
  const [tasks,       setTasks]       = useState<TaskItem[]>(note.tasks);
  const [alive,       setAlive]       = useState(true);
  const [pinEjected,  setPinEjected]  = useState(false);

  const dragStart  = useRef({ x: 0, y: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const driftX     = useRef((Math.random() - 0.5) * 200);
  const driftRot   = useRef((Math.random() - 0.5) * 28 + (Math.random() > 0.5 ? 12 : -12));

  /* natural slight rotation on creation */
  const noteRotation = useRef((Math.random() - 0.5) * 3);

  const saveContent = useCallback((val: string) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      updateNote(note._id, { content: val });
      await boardApi.updateNote(boardId, note._id, { content: val });
      socketEmit(SOCKET_EVENTS.NOTE_UPDATED, { boardId, noteId: note._id, updates: { content: val } });
    }, 600);
  }, [boardId, note._id, updateNote]);

  const saveTasks = useCallback(async (t: TaskItem[]) => {
    setTasks(t);
    updateNote(note._id, { tasks: t });
    await boardApi.updateNote(boardId, note._id, { tasks: t });
  }, [boardId, note._id, updateNote]);

  const handleDelete = async () => {
    setPinEjected(true);
    await new Promise(r => setTimeout(r, 140));
    setAlive(false);
    setTimeout(() => {
      removeNote(note._id);
      boardApi.deleteNote(boardId, note._id).catch(console.error);
      socketEmit(SOCKET_EVENTS.NOTE_DELETED, { boardId, noteId: note._id });
    }, 720);
  };

  const handleDuplicate = async () => {
    try { addNote(await boardApi.duplicateNote(boardId, note._id)); }
    catch (e) { console.error(e); }
  };

  const handleColorChange = async (color: NoteColor) => {
    updateNote(note._id, { color });
    await boardApi.updateNote(boardId, note._id, { color });
  };

  const handleDragStop = (_e: unknown, d: { x: number; y: number }) => {
    if (Math.abs(d.x - dragStart.current.x) < 3 &&
        Math.abs(d.y - dragStart.current.y) < 3) return;
    updateNote(note._id, { x: d.x, y: d.y });
    boardApi.updatePosition(boardId, note._id, d.x, d.y).catch(console.error);
    socketEmit(SOCKET_EVENTS.NOTE_MOVED, { boardId, noteId: note._id, x: d.x, y: d.y });
  };

  const handleResizeStop = async (
    _e: unknown, _d: unknown,
    ref: HTMLElement, _delta: unknown,
    pos: { x: number; y: number }
  ) => {
    const w = parseInt(ref.style.width);
    const h = parseInt(ref.style.height);
    updateNote(note._id, { width: w, height: h, x: pos.x, y: pos.y });
    await boardApi.updateNote(boardId, note._id, { width: w, height: h });
    await boardApi.updatePosition(boardId, note._id, pos.x, pos.y);
  };

  const handleMouseDown = () => {
    onSelect();
    const topZ = (useNoteStore.getState().getOrderedNotes().at(-1)?.zIndex ?? 0) + 1;
    updateNote(note._id, { zIndex: topZ });
    boardApi.bringToFront(boardId, note._id).catch(console.error);
  };

  const isOverdue = !!(note.reminderAt && new Date(note.reminderAt).getTime() < Date.now());

  return (
    <AnimatePresence>
      {alive && (
        <Rnd
          key={note._id}
          position={{ x: note.x, y: note.y }}
          size={{ width: note.width, height: note.height }}
          minWidth={160} minHeight={160}
          maxWidth={480} maxHeight={560}
          bounds="parent"
          dragHandleClassName="note-drag-handle"
          onDragStart={(_e, d) => { dragStart.current = { x: d.x, y: d.y }; }}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          onMouseDown={handleMouseDown}
          style={{ zIndex: note.zIndex }}
          enableResizing={{
            bottom: true, bottomRight: true, right: true,
            bottomLeft: true, left: true,
            top: false, topLeft: false, topRight: false,
          }}
        >
          {/* Overflow visible for pin + toolbar above card */}
          <div
            style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Toolbar */}
            <AnimatePresence>
              {isHovered && !isEditing && (
                <NoteToolbar
                  boardId={boardId}
                  noteId={note._id}
                  currentColor={note.color}
                  reminderAt={note.reminderAt}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onColorChange={handleColorChange}
                />
              )}
            </AnimatePresence>

            {/* ── Pin ── */}
            <motion.div
              style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                marginLeft: -10,
                zIndex: 20,
                pointerEvents: 'none',
                filter: `drop-shadow(0 3px 5px rgba(0,0,0,0.50))`,
              }}
              initial={{ y: -60, scale: 0.4, opacity: 0 }}
              animate={pinEjected
                ? { y: -80, scale: 0.6, opacity: 0 }
                : { y: 0,   scale: 1,   opacity: 1 }
              }
              transition={pinEjected
                ? { duration: 0.22, ease: 'easeOut' }
                : { type: 'spring', stiffness: 200, damping: 11, mass: 1, delay: 0.08 }
              }
            >
              {/* Small colored pin — matching reference exactly */}
              <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
                <circle cx="10" cy="9" r="9" fill={colors.pin}/>
                <circle cx="10" cy="9" r="9" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1"/>
                <circle cx="10" cy="9" r="5.5" fill="white" fillOpacity="0.22"/>
                <ellipse cx="7.5" cy="6.5" rx="2.8" ry="1.8" fill="white" fillOpacity="0.55"/>
                {/* Needle */}
                <line x1="10" y1="18" x2="10" y2="26"
                      stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>

            {/* ── Note card ── */}
            <motion.div
              className="note-drag-handle"
              style={{
                width: '100%', height: '100%',
                backgroundColor: colors.bg,
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'grab',
                userSelect: 'none',
              }}
              initial={{ opacity: 0, scale: 0.55, rotate: -12, y: -40 }}
              animate={{
                opacity: 1, scale: 1, y: 0,
                rotate: note.rotation ?? noteRotation.current,
                boxShadow: isSelected
                  ? `6px 14px 40px ${colors.shadow}, 0 2px 8px rgba(0,0,0,0.18)`
                  : isHovered
                  ? `5px 12px 32px ${colors.shadow}, 0 2px 6px rgba(0,0,0,0.14)`
                  : `3px 8px 22px ${colors.shadow}, 0 1px 4px rgba(0,0,0,0.12)`,
                outline: isOverdue ? '2px solid #22c55e' : 'none',
              }}
              exit={{
                opacity: 0, y: 260,
                x: driftX.current,
                rotate: (note.rotation ?? noteRotation.current) + driftRot.current,
                scale: 0.5,
                transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onDoubleClick={() => !isEditing && setIsEditing(true)}
            >
              {/* Subtle ruled lines — like real notepad paper */}
              {[80, 116, 152, 188, 224, 260].map((y) => (
                <div key={y} style={{
                  position: 'absolute', left: 20, right: 16, top: y,
                  height: 1, background: colors.line, pointerEvents: 'none',
                }}/>
              ))}

              {/* Folded corner — bottom right */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 0, height: 0,
                borderStyle: 'solid',
                borderWidth: '0 0 28px 28px',
                borderColor: `transparent transparent rgba(0,0,0,0.12) transparent`,
                zIndex: 2,
              }}/>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 0, height: 0,
                borderStyle: 'solid',
                borderWidth: '28px 28px 0 0',
                borderColor: `${colors.bg} transparent transparent transparent`,
                filter: 'brightness(0.88)',
                zIndex: 3,
              }}/>

              {/* Content area */}
              <div style={{ padding: '28px 18px 32px 20px', height: '100%', overflow: 'auto' }}>
                {note.type === 'task' ? (
                  <TaskList tasks={tasks} textColor={colors.text} onChange={saveTasks} />
                ) : isEditing ? (
                  <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => { setContent(e.target.value); saveContent(e.target.value); }}
                    onBlur={() => setIsEditing(false)}
                    style={{
                      width: '100%', height: '100%',
                      background: 'transparent', border: 'none', outline: 'none',
                      resize: 'none', fontSize: '22px', lineHeight: '1.45',
                      color: colors.text, fontFamily: "'Caveat', cursive",
                      fontWeight: 500,
                    }}
                    placeholder="Write something…"
                  />
                ) : (
                  <p style={{
                    fontSize: '22px', lineHeight: '1.45',
                    color: colors.text,
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 500,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    cursor: 'text',
                    opacity: content ? 1 : 0.4,
                    margin: 0,
                  }}>
                    {content || 'Double-click to edit…'}
                  </p>
                )}
              </div>

              {/* Urgent badge */}
              {note.type === 'urgent' && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 12,
                  fontSize: '11px', fontWeight: 700,
                  color: colors.text, opacity: 0.6,
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  🚨 URGENT
                </div>
              )}
            </motion.div>
          </div>
        </Rnd>
      )}
    </AnimatePresence>
  );
}
