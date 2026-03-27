import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SequencesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sequences</h1>
        <Button>
          <Plus className="w-4 h-4 mr-1.5" />
          New Sequence
        </Button>
      </header>
    </div>
  );
}
