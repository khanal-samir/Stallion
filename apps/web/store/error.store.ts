import type { AppErrorInput } from "@/lib/error";
import { create } from "zustand";

type ErrorState = {
  error: AppErrorInput | null;
};

type ErrorActions = {
  setError: (error: AppErrorInput) => void;
  clearError: () => void;
};

export type ErrorStore = ErrorState & ErrorActions;

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  setError(error) {
    set({ error });
  },
  clearError() {
    set({ error: null });
  },
}));
