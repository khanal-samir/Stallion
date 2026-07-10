"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { useCreateSequence } from "@/hooks/queries/use-sequences";

export function NewSequenceRedirect() {
  const router = useRouter();
  const { mutate } = useCreateSequence();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    mutate(
      { name: `Untitled sequence ${new Date().toLocaleDateString()}` },
      { onSuccess: (sequence) => router.replace(`/sequences/${sequence.id}`) },
    );
  }, [mutate, router]);

  return <LoadingState variant="page" text="Creating sequence..." />;
}
