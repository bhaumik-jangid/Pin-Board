import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createBoard, getMyBoards, getBoard,
  updateBoardLock, updateViewport,
} from '../controllers/board.controller';
import {
  getNotes, createNote, updateNote,
  updateNotePosition, bringNoteToFront,
  deleteNote, duplicateNote,
  searchNotes, getArchivedNotes, restoreNote,
} from '../controllers/note.controller';

const router = Router();
router.use(authenticate);

router.post('/',                                      createBoard);
router.get('/',                                       getMyBoards);
router.get('/:boardId',                               getBoard);
router.patch('/:boardId/lock',                        updateBoardLock);
router.patch('/:boardId/viewport',                    updateViewport);

router.get('/:boardId/notes',                         getNotes);
router.get('/:boardId/notes/search',                  searchNotes);
router.get('/:boardId/notes/archived',                getArchivedNotes);
router.post('/:boardId/notes',                        createNote);
router.patch('/:boardId/notes/:noteId',               updateNote);
router.patch('/:boardId/notes/:noteId/position',      updateNotePosition);
router.patch('/:boardId/notes/:noteId/front',         bringNoteToFront);
router.patch('/:boardId/notes/:noteId/restore',       restoreNote);
router.delete('/:boardId/notes/:noteId',              deleteNote);
router.post('/:boardId/notes/:noteId/duplicate',      duplicateNote);

export default router;
