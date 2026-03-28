import { FileQuestion } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface NotFoundStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function NotFoundState({
  title = "Not found",
  description = "The resource you're looking for doesn't exist or has been removed.",
  backHref = "/dashboard",
  backLabel = "Go to dashboard",
  className,
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center py-16 text-center min-h-[60vh]",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-7 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-6">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
