"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function PageHeader({ title, description, canEdit, onEdit }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {canEdit && onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
      )}
    </div>
  );
}
