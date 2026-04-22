import { useState, useCallback } from "react";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

export interface EntityDrawerState<TEntity> {
  // t with enity name attached to avoid confusion with other open states in the app
  open: boolean;
  mode: EntitySheetMode;
  entity?: TEntity;
}

export function useEntityDrawer<TEntity extends { id: string }>() {
  const [drawer, setDrawer] = useState<EntityDrawerState<TEntity>>({
    open: false,
    mode: "view",
  });

  const openDrawer = useCallback((mode: EntitySheetMode, entity?: TEntity) => {
    setDrawer({ open: true, mode, entity });
  }, []);

  const onDrawerOpenChange = useCallback((open: boolean) => {
    setDrawer((current) => ({ ...current, open }));
  }, []);

  const onDrawerModeChange = useCallback((mode: EntitySheetMode) => {
    setDrawer((current) => ({ ...current, mode }));
  }, []);

  return {
    drawer,
    openDrawer,
    onDrawerOpenChange,
    onDrawerModeChange,
  };
}
