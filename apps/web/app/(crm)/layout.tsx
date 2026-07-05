import { SidebarProvider, SidebarInset, SidebarTrigger } from "@workspace/ui/components/ui/sidebar";
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";
import { CrmWorkspaceGate } from "@/components/onboarding/crm-workspace-gate";
import { CrmProductTour } from "@/components/onboarding/crm-product-tour";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmWorkspaceGate>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="relative min-w-0 overflow-hidden bg-background">
            <div className="pointer-events-none absolute -left-24 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />
            <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background px-6">
              <SidebarTrigger className="-ml-1" />
              <ThemeToggle />
            </header>
            <main className="relative z-10 min-w-0 flex-1 overflow-auto p-8">
              <div>{children}</div>
            </main>
          </SidebarInset>
          <CrmProductTour />
        </SidebarProvider>
      </TooltipProvider>
    </CrmWorkspaceGate>
  );
}
