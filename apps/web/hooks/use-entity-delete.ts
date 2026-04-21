import { useState, useCallback } from "react";

export function useEntityDelete<TEntity extends { id: string }>(options?: {
  enableBulkDelete?: boolean;
}) {
  const { enableBulkDelete = false } = options ?? {};
  const [deleteTarget, setDeleteTarget] = useState<TEntity | "bulk" | null>(null);

  const openDelete = useCallback((entity: TEntity) => {
    setDeleteTarget(entity);
  }, []);

  const openBulkDelete = useCallback(() => {
    if (!enableBulkDelete) return;
    setDeleteTarget("bulk");
  }, [enableBulkDelete]);

  const closeDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const isBulkDelete = deleteTarget === "bulk";
  const isEntityDelete = deleteTarget !== null && deleteTarget !== "bulk";

  return {
    deleteTarget,
    openDelete,
    openBulkDelete,
    closeDelete,
    isBulkDelete,
    isEntityDelete,
  };
}
