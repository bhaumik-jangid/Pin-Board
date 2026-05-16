import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const AVATAR_COLORS = [
  '#F9C74F', '#F8961E', '#F3722C',
  '#90BE6D', '#43AA8B', '#4D908E',
  '#577590', '#277DA1',
];

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatarColor: {
      type: String,
      default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);
