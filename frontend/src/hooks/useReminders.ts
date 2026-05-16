import { useEffect, useCallback } from 'react';
import { useNoteStore } from '@/stores/note.store';

const POLL_INTERVAL = 30_000; // 30 seconds
const fired = new Set<string>(); // prevent double-firing per session

export function useReminders() {
  const getOrderedNotes = useNoteStore((s) => s.getOrderedNotes);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const checkReminders = useCallback(() => {
    const now = Date.now();
    const notes = getOrderedNotes();

    for (const note of notes) {
      if (!note.reminderAt) continue;
      const dueAt = new Date(note.reminderAt).getTime();
      if (dueAt <= now && !fired.has(note._id)) {
        fired.add(note._id);

        /* Browser notification */
        if (Notification.permission === 'granted') {
          new Notification('📌 PinBoard Reminder', {
            body:    note.content || 'You have a reminder!',
            icon:    '/favicon.svg',
            tag:     note._id,
            silent:  false,
          });
        }

        /* In-app toast via custom event — BoardPage listens */
        window.dispatchEvent(new CustomEvent('pinboard:reminder', {
          detail: { noteId: note._id, content: note.content },
        }));
      }
    }
  }, [getOrderedNotes]);

  useEffect(() => {
    requestPermission();
    checkReminders();
    const id = setInterval(checkReminders, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [checkReminders, requestPermission]);
}
