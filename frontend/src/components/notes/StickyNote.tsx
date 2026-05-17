import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import type { Note, NoteColor, TaskItem } from '@/types/note.types';
import { NOTE_COLORS, NOTE_TYPE_META } from '@/lib/noteColors';
import { NotePin } from '@/components/pins/NotePin';
import { NoteToolbar } from './NoteToolbar';
import { TaskList } from './TaskList';
import { useNoteStore } from '@/stores/note.store';
import { socketEmit }     from '@/lib/socketEmit';
import { SOCKET_EVENTS }   from '@/lib/socketEvents';
import { boardApi } from '@/services/boardApi';
import { cn } from '@/lib/utils';

interface Props {
  note: Note;
  boardId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function StickyNote({ note, boardId, isSelected, onSelect }: Props) {
  const { updateNote, removeNote, addNote } = useNoteStore();
  const colors = NOTE_COLORS[note.color];
  const meta   = NOTE_TYPE_META[note.type];

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content,   setContent]   = useState(note.content);
  const [tasks,     setTasks]     = useState<TaskItem[]>(note.tasks);
  const [alive,     setAlive]     = useState(true);
  const [pinEjected, setPinEjected] = useState(false);

  const isOverdue = !!(note.reminderAt && new Date(note.reminderAt).getTime() < Date.now());
  const dragStartPos = useRef({ x: 0, y: 0 });
  const saveTimer    = useRef<ReturnType<typeof setTimeout>>();
  /* random drift direction so each deleted note falls differently */
  const driftX = useRef((Math.random() - 0.5) * 180);
  const driftRot = useRef((Math.random() - 0.5) * 30);

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
    /* 1. Pin ejects upward first */
    setPinEjected(true);
    await new Promise(r => setTimeout(r, 120));
    /* 2. Note begins falling */
    setAlive(false);
    /* 3. DOM cleanup after animation finishes */
    setTimeout(() => {
      removeNote(note._id);
      boardApi.deleteNote(boardId, note._id).catch(console.error);
      socketEmit(SOCKET_EVENTS.NOTE_DELETED, { boardId, noteId: note._id });
    }, 700);
  };

  const handleDuplicate = async () => {
    try { addNote(await boardApi.duplicateNote(boardId, note._id)); }
    catch (e) { console.error(e); }
  };

  const handleColorChange = async (color: NoteColor) => {
    updateNote(note._id, { color });
    await boardApi.updateNote(boardId, note._id, { color });
  };

  const handleDragStop = async (_e: unknown, d: { x: number; y: number }) => {
    if (Math.abs(d.x - dragStartPos.current.x) < 3 &&
        Math.abs(d.y - dragStartPos.current.y) < 3) return;
    updateNote(note._id, { x: d.x, y: d.y });
    await boardApi.updatePosition(boardId, note._id, d.x, d.y);
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

  return (
    <AnimatePresence>
      {alive && (
        <Rnd
          key={note._id}
          position={{ x: note.x, y: note.y }}
          size={{ width: note.width, height: note.height }}
          minWidth={180}
          minHeight={160}
          maxWidth={540}
          maxHeight={620}
          bounds="parent"
          dragHandleClassName="note-drag-handle"
          onDragStart={(_e, d) => { dragStartPos.current = { x: d.x, y: d.y }; }}
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
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onColorChange={handleColorChange}
                  reminderAt={note.reminderAt}
                />
              )}
            </AnimatePresence>

            {/* Pin — ejected upward on delete */}
            <motion.div
              style={{
                position: 'absolute',
                top: -(12 + 6),
                left: '50%',
                marginLeft: -12,
                zIndex: 20,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
              }}
              initial={{ y: -80, rotate: -30, scale: 0.4, opacity: 0 }}
              animate={pinEjected
                ? { y: -80, rotate: -40, scale: 0.7, opacity: 0 }
                : { y: 0,   rotate: 0,   scale: 1,   opacity: 1 }
              }
              transition={pinEjected
                ? { duration: 0.25, ease: 'easeOut' }
                : { type: 'spring', stiffness: 180, damping: 10, mass: 1.2, delay: 0.1 }
              }
            >
              <svg width={24} height={36} viewBox="0 0 24 36" fill="none">
                <circle cx="12" cy="11" r="10" fill={colors.pin} />
                <circle cx="12" cy="11" r="10" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                <circle cx="12" cy="11" r="6.5" fill="white" fillOpacity="0.2" />
                <ellipse cx="9" cy="8" rx="3" ry="2" fill="white" fillOpacity="0.55" />
                <line x1="12" y1="21" x2="12" y2="36" stroke={colors.pin} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="36" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.div>

            {/* Note card — leaf-drift fall on exit */}
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
              initial={{ opacity: 0, scale: 0.6, rotate: -10, y: -30 }}
              animate={{
                opacity: 1, scale: 1,
                rotate: note.rotation ?? 0,
                y: 0,
                boxShadow: isOverdue
                  ? '0 0 0 2.5px #22c55e, 0 0 24px rgba(34,197,94,0.35), 4px 10px 28px rgba(0,0,0,0.20)'
                  : isSelected
                  ? '5px 12px 36px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)'
                  : isHovered
                  ? '4px 10px 28px rgba(0,0,0,0.20), 0 2px 6px rgba(0,0,0,0.12)'
                  : '2px 6px 16px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.09)',
              }}
              exit={{
                opacity: 0,
                y: 240,
                x: driftX.current,
                rotate: (note.rotation ?? 0) + driftRot.current,
                scale: 0.55,
                transition: {
                  duration: 0.65,
                  ease: [0.25, 0.46, 0.45, 0.94],  /* gentle falling arc */
                },
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              {/* Folded corner */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
                borderStyle: 'solid', borderWidth: '0 0 22px 22px',
                borderColor: `transparent transparent rgba(0,0,0,0.10) transparent`,
                zIndex: 2,
              }}/>

              {/* Drag handle */}
              <div
                className="note-drag-handle"
                style={{
                  backgroundColor: colors.header,
                  padding: '8px 12px 6px',
                  cursor: 'grab',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ fontSize: '14px' }}>{meta.icon}</span>
                <span style={{
                  fontSize: '11px', fontWeight: 500,
                  color: colors.text, opacity: 0.65,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {meta.label}
                </span>
                <span style={{ marginLeft: 'auto', color: colors.text, opacity: 0.25, fontSize: '13px' }}>⠿</span>
              </div>

              {/* Body */}
              <div
                style={{ flex: 1, padding: '10px 12px', overflow: 'auto' }}
                onDoubleClick={() => !isEditing && setIsEditing(true)}
              >
                {note.type === 'task' ? (
                  <TaskList tasks={tasks} textColor={colors.text} onChange={saveTasks} />
                ) : isEditing ? (
                  <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => { setContent(e.target.value); saveContent(e.target.value); }}
                    onBlur={() => setIsEditing(false)}
                    style={{
                      width: '100%', height: '100%', minHeight: '80px',
                      background: 'transparent', border: 'none', outline: 'none',
                      resize: 'none', fontSize: '15px', lineHeight: '1.55',
                      color: colors.text, fontFamily: "'Caveat', cursive",
                    }}
                    placeholder="Write something…"
                  />
                ) : (
                  <p style={{
                    fontSize: '15px', lineHeight: '1.55',
                    color: colors.text, fontFamily: "'Caveat', cursive",
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    cursor: 'text', opacity: content ? 1 : 0.35, margin: 0,
                  }}>
                    {content || 'Double-click to edit…'}
                  </p>
                )}
              </div>

              {note.type === 'urgent' && (
                <div style={{
                  padding: '4px 12px', backgroundColor: colors.border,
                  color: colors.text, fontSize: '11px', fontWeight: 600,
                  textAlign: 'center', flexShrink: 0,
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
