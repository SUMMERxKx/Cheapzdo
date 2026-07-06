import { create } from "zustand";

// Which board and arc the user is currently looking at. The board id is also in
// the URL, this store is a convenience mirror for components that need it fast.
interface BoardState {
  activeBoardId: string | null;
  activeArcId: string | null;
  setActiveBoard: (id: string | null) => void;
  setActiveArc: (id: string | null) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeBoardId: null,
  activeArcId: null,
  setActiveBoard: (activeBoardId) => set({ activeBoardId }),
  setActiveArc: (activeArcId) => set({ activeArcId }),
}));
