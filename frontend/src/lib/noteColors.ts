import type { NoteColor, NoteType } from '@/types/note.types';

export const NOTE_COLORS: Record<NoteColor, {
  bg:     string;   /* main note body */
  shadow: string;   /* drop shadow color */
  text:   string;   /* text color */
  border: string;   /* border color */
  pin:    string;   /* pin head color */
  fold:   string;   /* folded corner overlay */
  line:   string;   /* subtle ruled line */
}> = {
  yellow: {
    bg:     '#f7e27a',
    shadow: 'rgba(180,140,20,0.35)',
    text:   '#3d2e00',
    border: '#d4c05a',
    pin:    '#e03030',   /* red pin — like reference */
    fold:   'rgba(160,120,0,0.12)',
    line:   'rgba(160,120,0,0.08)',
  },
  blue: {
    bg:     '#a8cfe8',
    shadow: 'rgba(40,100,160,0.30)',
    text:   '#0d2d4a',
    border: '#7fb3d5',
    pin:    '#2a6fd4',
    fold:   'rgba(30,80,140,0.10)',
    line:   'rgba(30,80,140,0.07)',
  },
  green: {
    bg:     '#b8e8c8',
    shadow: 'rgba(30,120,60,0.28)',
    text:   '#0d3320',
    border: '#8fc0a0',
    pin:    '#28a845',
    fold:   'rgba(20,100,50,0.10)',
    line:   'rgba(20,100,50,0.07)',
  },
  pink: {
    bg:     '#f4b8c0',
    shadow: 'rgba(180,50,80,0.28)',
    text:   '#4a0d18',
    border: '#f4b8c0',
    pin:    '#e0305a',
    fold:   'rgba(160,40,70,0.10)',
    line:   'rgba(160,40,70,0.07)',
  },
  purple: {
    bg:     '#cdb8e8',
    shadow: 'rgba(80,40,160,0.28)',
    text:   '#2a0d4a',
    border: '#cdb8e8',
    pin:    '#7c3aed',
    fold:   'rgba(70,30,140,0.10)',
    line:   'rgba(70,30,140,0.07)',
  },
  orange: {
    bg:     '#f7cfa0',
    shadow: 'rgba(180,90,20,0.28)',
    text:   '#3d1e00',
    border: '#f7cfa0',
    pin:    '#ea8c1e',
    fold:   'rgba(160,80,10,0.10)',
    line:   'rgba(160,80,10,0.07)',
  },
};

export const NOTE_TYPE_META: Record<NoteType, {
  label:        string;
  icon:         string;
  defaultColor: NoteColor;
}> = {
  normal:   { label: 'Note',     icon: '📝', defaultColor: 'yellow'  },
  task:     { label: 'Tasks',    icon: '✅', defaultColor: 'blue'    },
  reminder: { label: 'Reminder', icon: '🔔', defaultColor: 'green'   },
  urgent:   { label: 'Urgent',   icon: '🚨', defaultColor: 'pink'    },
  idea:     { label: 'Idea',     icon: '💡', defaultColor: 'purple'  },
};
