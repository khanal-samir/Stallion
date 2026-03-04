"use client";

import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KanbanBoardView } from "@/components/deals/kanban-board";
import { NewDealDialog } from "@/components/deals/new-deal-dialog";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Deals</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search deals..." className="w-64 pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1.5" />
            Filter
          </Button>
          <NewDealDialog />
          <ToggleGroup type="single" defaultValue="board" size="sm">
            <ToggleGroupItem value="board" aria-label="Board view">
              <LayoutGrid className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* ── Kanban Board ────────────────────────────── */}
      <KanbanBoardView />
    </div>
  );
}
