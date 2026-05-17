import { useCallback } from 'react';
import { useNoteStore } from '@/stores/note.store';
import { StickyNote } from '@/components/notes/StickyNote';

interface Props { boardId: string; }

export function BoardCanvas({ boardId }: Props) {
  const { getOrderedNotes, selectedNoteId, selectNote } = useNoteStore();
  const notes = getOrderedNotes();

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) selectNote(null);
  }, [selectNote]);

  return (
    /*
      Must be EXACTLY 3000×2000 to match InfiniteCanvas inner div.
      react-rnd bounds="parent" measures THIS element.
      If this is viewport-sized (~900×600) notes stop at the viewport edge.
    */
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: 3000,
        height: 2000,
        overflow: 'visible',
      }}
    >
      {notes.map((note) => (
        <StickyNote
          key={note._id}
          note={note}
          boardId={boardId}
          isSelected={selectedNoteId === note._id}
          onSelect={() => selectNote(note._id)}
        />
      ))}
    </div>
  );
}
