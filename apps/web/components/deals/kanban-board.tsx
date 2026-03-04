"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "@/components/deals/deal-card";
import { MOCK_DEALS, DEAL_STAGES, type Deal, type DealStage } from "@/types/crm";

function buildColumns(): Record<string, Deal[]> {
  const cols: Record<string, Deal[]> = {};
  for (const stage of DEAL_STAGES) {
    cols[stage] = MOCK_DEALS.filter((d) => d.stage === stage);
  }
  return cols;
}

function totalValue(deals: Deal[]) {
  return deals.reduce((sum, d) => sum + d.value, 0).toLocaleString();
}

export function KanbanBoardView() {
  const [columns, setColumns] = React.useState<Record<string, Deal[]>>(buildColumns);

  return (
    <Kanban value={columns} onValueChange={setColumns} getItemValue={(d: Deal) => d.id}>
      <KanbanBoard className="gap-3 overflow-x-auto pb-4 p-2 bg-muted/20">
        {DEAL_STAGES.map((stage: DealStage) => (
          <KanbanColumn
            key={stage}
            value={stage}
            className="w-[340px] shrink-0 bg-card rounded-xl border shadow-sm flex flex-col h-fit"
          >
            {/* Column header */}
            <div className="bg-muted/50 rounded-t-lg border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stage}</span>
                <Badge variant="secondary" className="text-xs">
                  {(columns[stage] ?? []).length}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                ${totalValue(columns[stage] ?? [])}
              </span>
            </div>

            {/* Column content */}
            <KanbanColumnContent
              value={stage}
              className="bg-muted/30 rounded-lg mx-2 p-3 flex flex-col gap-2 flex-1 min-h-[150px]"
            >
              {(columns[stage] ?? []).map((deal) => (
                <KanbanItem key={deal.id} value={deal.id} asChild>
                  <KanbanItemHandle asChild>
                    <div>
                      <DealCard deal={deal} />
                    </div>
                  </KanbanItemHandle>
                </KanbanItem>
              ))}
            </KanbanColumnContent>

            {/* Add button */}
            <button className="w-full px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-b-lg flex items-center justify-center gap-1 transition-colors mt-auto">
              <Plus className="w-3 h-3" /> Add deal
            </button>
          </KanbanColumn>
        ))}
      </KanbanBoard>

      <KanbanOverlay>
        <div className="bg-card border border-primary/50 rounded-lg opacity-80 rotate-1 shadow-xl w-[324px] h-[120px]" />
      </KanbanOverlay>
    </Kanban>
  );
}
