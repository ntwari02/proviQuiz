import { create } from "zustand";

type ColorMode = "light" | "dark";

type UiState = {
  colorMode: ColorMode;
};

type UiActions = {
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
};

const STORAGE_KEY = "proviquiz:colorMode";

function readInitialMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

export const useUiStore = create<UiState & UiActions>((set, get) => ({
  colorMode: readInitialMode(),

  toggleColorMode: () => {
    const next: ColorMode = get().colorMode === "light" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, next);
    set({ colorMode: next });
  },

  setColorMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ colorMode: mode });
  },
}));

