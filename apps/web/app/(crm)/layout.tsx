import { SidebarProvider, SidebarInset, SidebarTrigger } from "@workspace/ui/components/ui/sidebar";
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/90 px-6 backdrop-blur-xl">
            <SidebarTrigger className="-ml-1" />
            <ThemeToggle />
          </header>
          <main className="relative min-w-0 flex-1 overflow-auto bg-background p-8">
            <div className="pointer-events-none absolute -left-24 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-muted blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:44px_44px] text-foreground/10" />
            <div className="relative">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
