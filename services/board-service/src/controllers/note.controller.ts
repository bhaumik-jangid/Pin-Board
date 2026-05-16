import { Response, NextFunction } from 'express';
import { Note } from '../models/note.model';
import { Board } from '../models/board.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notes = await Note.find({ boardId: req.params.boardId, isArchived: false }).sort({ zIndex: 1 });
    res.json({ success: true, data: { notes } });
  } catch (err) { next(err); }
};

export const searchNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, type, color } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {
      boardId: req.params.boardId,
      isArchived: false,
    };
    if (q)     filter.content = { $regex: q, $options: 'i' };
    if (type)  filter.type    = type;
    if (color) filter.color   = color;
    const notes = await Note.find(filter).sort({ updatedAt: -1 }).limit(50);
    res.json({ success: true, data: { notes } });
  } catch (err) { next(err); }
};

export const getArchivedNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notes = await Note.find({ boardId: req.params.boardId, isArchived: true })
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: { notes } });
  } catch (err) { next(err); }
};

export const restoreNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, boardId: req.params.boardId },
      { isArchived: false },
      { new: true }
    );
    if (!note) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    res.json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);
    if (!board) { res.status(404).json({ success: false, message: 'Board not found' }); return; }
    const highestZ = await Note.findOne({ boardId }).sort({ zIndex: -1 }).select('zIndex');
    const note = await Note.create({
      boardId, creatorId: req.user!.userId,
      type:    req.body.type    ?? 'normal',
      color:   req.body.color   ?? 'yellow',
      content: req.body.content ?? '',
      x:       req.body.x       ?? 120,
      y:       req.body.y       ?? 120,
      width:   req.body.width   ?? 200,
      height:  req.body.height  ?? 200,
      zIndex:  (highestZ?.zIndex ?? 0) + 1,
    });
    res.status(201).json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowed = ['content','color','type','tasks','width','height','reminderAt'];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, boardId: req.params.boardId },
      updates, { new: true }
    );
    if (!note) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    res.json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const updateNotePosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { x, y } = req.body as { x: number; y: number };
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, boardId: req.params.boardId },
      { x, y }, { new: true }
    );
    if (!note) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    res.json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const bringNoteToFront = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const highestZ = await Note.findOne({ boardId: req.params.boardId }).sort({ zIndex: -1 }).select('zIndex');
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, boardId: req.params.boardId },
      { zIndex: (highestZ?.zIndex ?? 0) + 1 }, { new: true }
    );
    res.json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Note.findOneAndUpdate(
      { _id: req.params.noteId, boardId: req.params.boardId },
      { isArchived: true }
    );
    res.json({ success: true, message: 'Note archived' });
  } catch (err) { next(err); }
};

export const duplicateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const original = await Note.findById(req.params.noteId);
    if (!original) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    const highestZ = await Note.findOne({ boardId: req.params.boardId }).sort({ zIndex: -1 }).select('zIndex');
    const note = await Note.create({
      boardId: original.boardId, creatorId: req.user!.userId,
      type: original.type, color: original.color,
      content: original.content, tasks: original.tasks,
      x: original.x + 24, y: original.y + 24,
      width: original.width, height: original.height,
      zIndex: (highestZ?.zIndex ?? 0) + 1,
    });
    res.status(201).json({ success: true, data: { note } });
  } catch (err) { next(err); }
};
