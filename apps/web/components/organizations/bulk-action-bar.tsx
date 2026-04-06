"use client";

import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
}

export function BulkActionBar({ count, onClear }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card shadow-xl border-t border-border/50 px-6 py-3 flex items-center gap-3 z-50">
      <span className="text-sm font-medium">{count} organizations selected</span>
      <Separator orientation="vertical" className="h-5" />
      <Button variant="outline" size="sm">
        Add People
      </Button>
      <Button variant="outline" size="sm">
        Change Owner
      </Button>
      <Button variant="outline" size="sm">
        Export
      </Button>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
