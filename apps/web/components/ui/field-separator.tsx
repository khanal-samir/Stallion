import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
  return (
    <div className={cn("relative my-4", className)} {...props}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      {children && (
        <div className="relative flex justify-center text-xs uppercase">
          <span data-slot="field-separator-content" className="bg-card text-muted-foreground px-2">
            {children}
          </span>
        </div>
      )}
    </div>
  );
}
