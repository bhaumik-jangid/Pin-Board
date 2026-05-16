import mongoose, { Document, Schema } from 'mongoose';

export type NoteType   = 'normal' | 'task' | 'reminder' | 'urgent' | 'idea';
export type NoteColor  = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface ITaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface INoteDocument extends Document {
  boardId: string;
  creatorId: string;
  type: NoteType;
  color: NoteColor;
  content: string;
  tasks: ITaskItem[];
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  isPinned: boolean;
  reminderAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskItemSchema = new Schema<ITaskItem>(
  {
    id:   { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const noteSchema = new Schema<INoteDocument>(
  {
    boardId:    { type: String, required: true, index: true },
    creatorId:  { type: String, required: true },
    type:       { type: String, enum: ['normal','task','reminder','urgent','idea'], default: 'normal' },
    color:      { type: String, enum: ['yellow','blue','green','pink','purple','orange'], default: 'yellow' },
    content:    { type: String, default: '' },
    tasks:      { type: [taskItemSchema], default: [] },
    x:          { type: Number, default: 100 },
    y:          { type: Number, default: 100 },
    width:      { type: Number, default: 200 },
    height:     { type: Number, default: 200 },
    zIndex:     { type: Number, default: 1 },
    rotation:   { type: Number, default: 0 },
    isPinned:   { type: Boolean, default: true },
    reminderAt: { type: Date },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noteSchema.index({ boardId: 1, isArchived: 1 });

export const Note = mongoose.model<INoteDocument>('Note', noteSchema);
