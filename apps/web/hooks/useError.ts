import { useEffect } from "react";
import { toast } from "sonner";
import { normalizeAppError } from "@/lib/error";
import { useErrorStore } from "@/store/error.store";

export const useError = () => {
  useEffect(() => {
    const unsubscribe = useErrorStore.subscribe((state, prevState) => {
      if (state.error !== prevState.error && state.error !== null) {
        const { message } = normalizeAppError(state.error);

        toast.error(message);
        useErrorStore.getState().clearError();
      }
    });

    return () => unsubscribe();
  }, []);
};
