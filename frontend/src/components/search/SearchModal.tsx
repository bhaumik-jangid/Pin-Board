import { createPortal } from 'react-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { boardApi } from '@/services/boardApi';
import type { Note, NoteType, NoteColor } from '@/types/note.types';
import { NOTE_COLORS, NOTE_TYPE_META } from '@/lib/noteColors';
// import { useNoteStore } from '@/stores/note.store';

interface Props {
  boardId: string;
  onClose: () => void;
  onJumpTo: (note: Note) => void;
}

const TYPES:  NoteType[]  = ['normal','task','reminder','urgent','idea'];
const COLORS: NoteColor[] = ['yellow','blue','green','pink','purple','orange'];

export function SearchModal({ boardId, onClose, onJumpTo }: Props) {
  const [q,        setQ]        = useState('');
  const [typeF,    setTypeF]    = useState<NoteType | ''>('');
  const [colorF,   setColorF]   = useState<NoteColor | ''>('');
  const [results,  setResults]  = useState<Note[]>([]);
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (query: string, type: string, color: string) => {
    if (!query && !type && !color) {
      setResults([]); return;
    }
    setLoading(true);
    try {
      const res = await boardApi.searchNotes(boardId, query, type || undefined, color || undefined);
      setResults(res);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [boardId]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(q, typeF, colorF), 300);
  }, [q, typeF, colorF, doSearch]);

  /* Cmd+K / Ctrl+K to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,   scale: 1    }}
        exit={{   opacity: 0, y: -20,  scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        style={{
          position: 'fixed', top: '12%', left: '50%',
          transform: 'translateX(-50%)', zIndex: 9001,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: '20px', width: 520,
          boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Search size={18} color="#aaa"/>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '16px', color: '#333',
              background: 'transparent',
            }}
          />
          <kbd style={{
            fontSize: '11px', color: '#aaa',
            background: '#f0f0f0', borderRadius: '6px',
            padding: '2px 6px', fontFamily: 'monospace',
          }}>Esc</kbd>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex',
          }}>
            <X size={16}/>
          </button>
        </div>

        {/* Filters row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          flexWrap: 'wrap',
        }}>
          {/* Type filter */}
          {TYPES.map((t) => {
            const meta = NOTE_TYPE_META[t];
            const active = typeF === t;
            return (
              <button key={t}
                onClick={() => setTypeF(active ? '' : t)}
                style={{
                  padding: '4px 10px', borderRadius: '20px', border: 'none',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  background: active ? '#5a3e1b' : 'rgba(0,0,0,0.05)',
                  color: active ? 'white' : '#666',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.15s',
                }}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
          <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)' }}/>
          {/* Color filter */}
          {COLORS.map((c) => (
            <button key={c}
              onClick={() => setColorF(colorF === c ? '' : c)}
              title={c}
              style={{
                width: 20, height: 20, borderRadius: '50%', border: 'none',
                backgroundColor: NOTE_COLORS[c].bg,
                cursor: 'pointer',
                outline: colorF === c ? `2.5px solid ${NOTE_COLORS[c].pin}` : '2.5px solid transparent',
                outlineOffset: '2px',
                transition: 'transform 0.12s',
                transform: colorF === c ? 'scale(1.25)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (q || typeF || colorF) && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
              No notes found
            </div>
          )}
          {!loading && !q && !typeF && !colorF && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>
              Start typing to search your notes
            </div>
          )}
          <AnimatePresence>
            {results.map((note, i) => {
              const colors = NOTE_COLORS[note.color];
              const meta   = NOTE_TYPE_META[note.type];
              return (
                <motion.button
                  key={note._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { onJumpTo(note); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: '12px', padding: '12px 20px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Color chip */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 500, color: '#333',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {note.content || <span style={{ color: '#aaa' }}>Empty note</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                      {meta.label} · {note.color} · {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight size={14} color="#ccc"/>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
