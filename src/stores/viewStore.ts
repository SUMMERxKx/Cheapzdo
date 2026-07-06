import { create } from "zustand";

// Sprint board view mode and filters. List is the default view on first load.
// These get mirrored to the URL in phase 5 so a view is shareable.
export type ViewMode = "list" | "kanban";

export interface TaskFilters {
  search: string;
  typeId: string | "all";
  statusId: string | "all";
  assigneeId: string | "all";
  priority: "critical" | "high" | "medium" | "low" | "all";
  blockersOnly: boolean;
}

const emptyFilters: TaskFilters = {
  search: "",
  typeId: "all",
  statusId: "all",
  assigneeId: "all",
  priority: "all",
  blockersOnly: false,
};

interface ViewState {
  viewMode: ViewMode;
  filters: TaskFilters;
  setViewMode: (m: ViewMode) => void;
  setFilters: (f: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  viewMode: "list",
  filters: emptyFilters,
  setViewMode: (viewMode) => set({ viewMode }),
  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
  resetFilters: () => set({ filters: emptyFilters }),
}));
