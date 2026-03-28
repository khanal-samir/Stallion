import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/ui/toggle-group";
import { PageHeader } from "@/components/layout/page-header";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search deals..." className="w-64 pl-8" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Filter
            </Button>
            <ToggleGroup type="single" defaultValue="board" size="sm">
              <ToggleGroupItem value="board" aria-label="Board view">
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      />
    </div>
  );
}
