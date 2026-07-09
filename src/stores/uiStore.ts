import { create } from "zustand";
import { persist } from "zustand/middleware";

// Ephemeral UI state only. Never put server data here, that lives in TanStack Query.
export type Theme = "dark" | "light" | "cherry" | "retro" | "neon" | "winter";

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  createBoardOpen: boolean;
  listColumnOrder: string[];
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setCreateBoardOpen: (open: boolean) => void;
  setListColumnOrder: (order: string[]) => void;
}

// Reflect the theme onto the html element so the CSS variables switch.
export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarCollapsed: false,
      commandOpen: false,
      createBoardOpen: false,
      listColumnOrder: [],
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setCreateBoardOpen: (createBoardOpen) => set({ createBoardOpen }),
      setListColumnOrder: (listColumnOrder) => set({ listColumnOrder }),
    }),
    {
      name: "arcflow-ui",
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, listColumnOrder: s.listColumnOrder }),
    }
  )
);
