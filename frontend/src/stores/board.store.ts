import { create } from 'zustand';

export type CornerIndex = 0 | 1 | 2 | 3;

export interface PinState {
  index: CornerIndex;
  inserted: boolean;  // true = pin is in the corner, false = removed to tray
}

interface BoardState {
  isLocked: boolean;
  pins: PinState[];            // always 4 entries, indices 0-3
  removedCount: number;        // how many pins are in the tray

  initPins: () => void;
  removePin: (index: CornerIndex) => void;
  reinsertPin: (index: CornerIndex) => void;
  reinsertAll: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  isLocked: true,
  pins: [],
  removedCount: 0,

  initPins: () => set({
    pins: [0, 1, 2, 3].map((i) => ({ index: i as CornerIndex, inserted: true })),
    isLocked: true,
    removedCount: 0,
  }),

  removePin: (index) => {
    const pins = get().pins.map((p) =>
      p.index === index ? { ...p, inserted: false } : p
    );
    const removedCount = pins.filter((p) => !p.inserted).length;
    const isLocked = removedCount < 4;  // locked until ALL 4 removed
    set({ pins, removedCount, isLocked });
  },

  reinsertPin: (index) => {
    const pins = get().pins.map((p) =>
      p.index === index ? { ...p, inserted: true } : p
    );
    const removedCount = pins.filter((p) => !p.inserted).length;
    set({ pins, removedCount, isLocked: true }); // any pin back → locked
  },

  reinsertAll: () => set({
    pins: [0, 1, 2, 3].map((i) => ({ index: i as CornerIndex, inserted: true })),
    removedCount: 0,
    isLocked: true,
  }),
}));
