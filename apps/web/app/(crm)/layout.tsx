import { SidebarProvider, SidebarInset, SidebarTrigger } from "@workspace/ui/components/ui/sidebar";
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
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
            <SidebarTrigger className="fixed left-3 top-3 z-30 md:hidden" />
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
