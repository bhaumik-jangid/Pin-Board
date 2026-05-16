import mongoose, { Document, Schema } from 'mongoose';

export interface IBoardDocument extends Document {
  name: string;
  ownerId: string;
  collaborators: string[];
  isLocked: boolean;
  viewportX: number;
  viewportY: number;
  zoom: number;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoardDocument>(
  {
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    ownerId:       { type: String, required: true, index: true },
    collaborators: { type: [String], default: [] },
    isLocked:      { type: Boolean, default: true },
    viewportX:     { type: Number, default: 0 },
    viewportY:     { type: Number, default: 0 },
    zoom:          { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Board = mongoose.model<IBoardDocument>('Board', boardSchema);
