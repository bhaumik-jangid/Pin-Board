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
      position: relative + explicit w/h is REQUIRED for react-rnd bounds="parent".
      Without it Rnd measures the wrong container and snaps to 0,0.
    */
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/*
        Inner container is position:relative — THIS is what Rnd measures for "parent".
        It must be the same size as the outer container.
      */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
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
    </div>
  );
}
