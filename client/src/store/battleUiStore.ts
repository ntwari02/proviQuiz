import { create } from "zustand";

type BattleUiState = {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
};

export const useBattleUiStore = create<BattleUiState>((set) => ({
  immersive: false,
  setImmersive: (immersive) => set({ immersive }),
}));
