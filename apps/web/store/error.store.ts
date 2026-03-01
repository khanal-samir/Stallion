import type { ApiErrorResponse } from "@workspace/validators";
import type { AxiosError } from "axios";
import { create } from "zustand";
type ErrorState = {
  error: AxiosError<ApiErrorResponse> | null;
};

type ErrorActions = {
  setError: (error: AxiosError<ApiErrorResponse>) => void;
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
