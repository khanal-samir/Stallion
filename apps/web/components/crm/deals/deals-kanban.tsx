"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Calendar, User, Building2, DollarSign } from "lucide-react";
import dayjs from "dayjs";
import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/reui/kanban";
import { useDeals, useUpdateDeal } from "@/hooks/queries/use-deals";
import type { Deal } from "@/types/crm";
import type { DealStage } from "@workspace/validators/schemas/crm";
import { DEAL_STAGE_OPTIONS, DEAL_STAGE_MAP } from "./deals-options";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawerState {
  open: boolean;
  mode: EntitySheetMode;
  deal?: Deal;
  initialStage?: string;
}

interface DealsKanbanProps {
  drawerState: DrawerState;
  onDrawerStateChange: (state: DrawerState) => void;
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const personName = deal.person?.name;
  const orgName = deal.org?.name;
  const ownerName = deal.owner?.name;

  return (
    <div
      className={cn(
        "relative bg-card border rounded-lg p-3 select-none",
        "hover:border-primary/40 hover:shadow-sm transition-all duration-150",
      )}
    >
      {/* Invisible click layer — sits above content but below drag handle */}
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-10 rounded-lg"
        aria-label={`Open deal: ${deal.title}`}
      />

      {/* Title */}
      <p className="font-medium text-sm text-foreground leading-snug mb-2 line-clamp-2 pr-1">
        {deal.title}
      </p>

      {/* Value */}
      {deal.value && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <DollarSign className="size-3 shrink-0" />
          <span className="font-medium text-foreground">
            {Number(deal.value).toLocaleString()}
          </span>
          <span>{deal.currency}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-col gap-1">
        {personName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3 shrink-0" />
            <span className="truncate">{personName}</span>
          </div>
        )}
        {orgName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{orgName}</span>
          </div>
        )}
        {deal.closeDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3 shrink-0" />
            <span>{dayjs(deal.closeDate).format("MMM D, YYYY")}</span>
          </div>
        )}
      </div>

      {ownerName && (
        <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-end">
          <span className="text-[10px] text-muted-foreground">{ownerName}</span>
        </div>
      )}
    </div>
  );
}

// ─── Overlay ghost card ───────────────────────────────────────────────────────

function DealCardGhost({ deal }: { deal: Deal }) {
  return (
    <div className="bg-card border border-primary/40 rounded-lg p-3 shadow-xl rotate-1 w-[232px] opacity-95">
      <p className="font-medium text-sm text-foreground line-clamp-2">{deal.title}</p>
      {deal.value && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <DollarSign className="size-3" />
          <span>
            {Number(deal.value).toLocaleString()} {deal.currency}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban board ─────────────────────────────────────────────────────────────

export function DealsKanban({ onDrawerStateChange }: DealsKanbanProps) {
  const { data, isLoading, isError } = useDeals({ pageSize: 100 });
  const { mutate: updateDeal } = useUpdateDeal();

  const deals = useMemo(() => data?.deals ?? [], [data]);

  // reui Kanban state: Record<stageId, Deal[]>
  // Initialised from server data; re-sync when server data updates.
  const serverColumns = useMemo<Record<string, Deal[]>>(() => {
    const map: Record<string, Deal[]> = {};
    for (const stage of DEAL_STAGE_OPTIONS) {
      map[stage.value] = [];
    }
    for (const deal of deals) {
      const bucket = map[deal.stage];
      if (bucket) bucket.push(deal);
    }
    return map;
  }, [deals]);

  // Local optimistic state — drives the reui Kanban
  const [columns, setColumns] = useState<Record<string, Deal[]>>(serverColumns);

  // Keep local state in sync with server (after refetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setColumns(serverColumns);
  }, [serverColumns]);

  // Lookup map for overlay rendering (must be before early returns)
  const allDealsMap = useMemo(() => {
    const m = new Map<string, Deal>();
    for (const deal of deals) m.set(deal.id, deal);
    return m;
  }, [deals]);

  // Called by reui only when an item crosses a column boundary at drop time
  function handleMove({ activeContainer, overContainer, activeIndex }: KanbanMoveEvent) {
    if (activeContainer === overContainer) return;

    const movedDeal = columns[activeContainer]?.[activeIndex];
    if (!movedDeal) return;

    const newStage = overContainer as DealStage;
    updateDeal({ dealId: movedDeal.id, input: { stage: newStage } });
  }

  function openDrawer(mode: EntitySheetMode, deal?: Deal, initialStage?: string) {
    onDrawerStateChange({ open: true, mode, deal, initialStage });
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {DEAL_STAGE_OPTIONS.map((stage) => (
          <div key={stage.value} className="flex flex-col animate-pulse">
            <div
              className={cn(
                "rounded-t-lg border border-b-0 px-3 py-2.5 border-t-2 bg-muted/40",
                stage.columnClassName,
              )}
            >
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="rounded-b-lg border border-t-0 p-2 min-h-[280px] bg-muted/10 flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-3 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-4/5" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Failed to load deals. Please refresh the page.
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(deal: Deal) => deal.id}
      onMove={handleMove}
    >
      <KanbanBoard className="grid grid-cols-3 gap-3">
        {DEAL_STAGE_OPTIONS.map((stage) => {
          const stageDeals = columns[stage.value] ?? [];
          const totalValue = stageDeals.reduce((acc, d) => {
            const v = d.value ? Number(d.value) : 0;
            return acc + (isNaN(v) ? 0 : v);
          }, 0);

          return (
            <KanbanColumn
              key={stage.value}
              value={stage.value}
            >
              {/* Column header — not a drag handle (columns are fixed order) */}
              <div
                className={cn(
                  "rounded-t-lg border border-b-0 px-3 py-2.5 border-t-2",
                  stage.columnClassName,
                  "bg-muted/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5",
                        stage.badgeClassName,
                      )}
                    >
                      {stage.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {stageDeals.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ${totalValue.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Drop zone */}
              <KanbanColumnContent
                value={stage.value}
                className={cn(
                  "rounded-b-lg border border-t-0 p-2 flex flex-col gap-2 min-h-[280px]",
                  "bg-muted/10",
                )}
              >
                {stageDeals.map((deal) => (
                  <KanbanItem key={deal.id} value={deal.id} className="rounded-lg">
                    <KanbanItemHandle className="block w-full">
                      <DealCard
                        deal={deal}
                        onClick={() => openDrawer("view", deal)}
                      />
                    </KanbanItemHandle>
                  </KanbanItem>
                ))}

                {/* Add deal */}
                <button
                  type="button"
                  onClick={() => openDrawer("create", undefined, stage.value)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground",
                    "rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors w-full mt-auto",
                  )}
                >
                  <Plus className="size-3.5" />
                  Add deal
                </button>
              </KanbanColumnContent>
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      {/* Drag overlay ghost */}
      <KanbanOverlay>
        {({ value }) => {
          const deal = allDealsMap.get(value as string);
          return deal ? <DealCardGhost deal={deal} /> : null;
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
