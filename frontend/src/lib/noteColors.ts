import type { NoteColor, NoteType } from '@/types/note.types';

export const NOTE_COLORS: Record<NoteColor, {
  bg: string;
  border: string;
  text: string;
  pin: string;
  header: string;
}> = {
  yellow: {
    bg:     '#fef9c3',
    border: '#fde047',
    text:   '#713f12',
    pin:    '#ca8a04',
    header: '#fef08a',
  },
  blue: {
    bg:     '#dbeafe',
    border: '#93c5fd',
    text:   '#1e3a5f',
    pin:    '#3b82f6',
    header: '#bfdbfe',
  },
  green: {
    bg:     '#dcfce7',
    border: '#86efac',
    text:   '#14532d',
    pin:    '#22c55e',
    header: '#bbf7d0',
  },
  pink: {
    bg:     '#fce7f3',
    border: '#f9a8d4',
    text:   '#831843',
    pin:    '#ec4899',
    header: '#fbcfe8',
  },
  purple: {
    bg:     '#ede9fe',
    border: '#c4b5fd',
    text:   '#3b0764',
    pin:    '#8b5cf6',
    header: '#ddd6fe',
  },
  orange: {
    bg:     '#ffedd5',
    border: '#fdba74',
    text:   '#7c2d12',
    pin:    '#f97316',
    header: '#fed7aa',
  },
};

export const NOTE_TYPE_META: Record<NoteType, {
  label: string;
  icon: string;
  defaultColor: NoteColor;
}> = {
  normal:   { label: 'Note',     icon: '📝', defaultColor: 'yellow' },
  task:     { label: 'Tasks',    icon: '✅', defaultColor: 'blue'   },
  reminder: { label: 'Reminder', icon: '🔔', defaultColor: 'green'  },
  urgent:   { label: 'Urgent',   icon: '🚨', defaultColor: 'pink'   },
  idea:     { label: 'Idea',     icon: '💡', defaultColor: 'purple' },
};
