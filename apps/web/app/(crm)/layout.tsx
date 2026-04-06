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
          <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
            <SidebarTrigger className="-ml-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
