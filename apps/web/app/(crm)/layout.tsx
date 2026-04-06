import { SidebarProvider, SidebarInset, SidebarTrigger } from "@workspace/ui/components/ui/sidebar";
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex items-center justify-between h-14 px-6 border-b border-border/50 shrink-0 bg-background">
            <SidebarTrigger className="-ml-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
