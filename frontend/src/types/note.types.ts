
export type NoteType  = 'normal' | 'task' | 'reminder' | 'urgent' | 'idea';
export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  _id: string;
  boardId: string;
  creatorId: string;
  type: NoteType;
  color: NoteColor;
  content: string;
  tasks: TaskItem[];
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  isPinned: boolean;
  reminderAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  _id: string;
  name: string;
  ownerId: string;
  isLocked: boolean;
  viewportX: number;
  viewportY: number;
  zoom: number;
}
