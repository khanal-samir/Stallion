"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SequenceCard } from "@/components/sequences/sequence-card";
import { MOCK_SEQUENCES } from "@/types/crm";

export default function SequencesPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sequences</h1>
        <Button>
          <Plus className="w-4 h-4 mr-1.5" />
          New Sequence
        </Button>
      </div>

      {/* ── Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK_SEQUENCES.map((seq) => (
          <SequenceCard key={seq.id} sequence={seq} />
        ))}
      </div>
    </div>
  );
}
