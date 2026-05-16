import { Response, NextFunction } from 'express';
import { Board } from '../models/board.model';
import { Note } from '../models/note.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const board = await Board.create({
      name: req.body.name || 'My Board',
      ownerId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: { board } });
  } catch (err) { next(err); }
};

export const getMyBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boards = await Board.find({ ownerId: req.user!.userId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: { boards } });
  } catch (err) { next(err); }
};

export const getBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) { res.status(404).json({ success: false, message: 'Board not found' }); return; }
    res.json({ success: true, data: { board } });
  } catch (err) { next(err); }
};

export const updateBoardLock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const board = await Board.findByIdAndUpdate(
      req.params.boardId,
      { isLocked: req.body.isLocked },
      { new: true }
    );
    res.json({ success: true, data: { board } });
  } catch (err) { next(err); }
};

export const updateViewport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { x, y, zoom } = req.body as { x: number; y: number; zoom: number };
    const board = await Board.findByIdAndUpdate(
      req.params.boardId,
      { viewportX: x, viewportY: y, zoom },
      { new: true }
    );
    res.json({ success: true, data: { board } });
  } catch (err) { next(err); }
};
