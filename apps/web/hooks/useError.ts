import { useEffect } from "react";
import { normalizeAppError } from "@/lib/error";
import { useErrorStore } from "@/store/error.store";
import { sileo } from "sileo";

export const useError = () => {
  useEffect(() => {
    const unsubscribe = useErrorStore.subscribe((state, prevState) => {
      if (state.error !== prevState.error && state.error !== null) {
        const { message } = normalizeAppError(state.error);

        sileo.error({ title: message });
        // Clear error after showing to prevent duplicate toasts
        useErrorStore.getState().clearError();
      }
    });

    return () => unsubscribe();
  }, []);
};
