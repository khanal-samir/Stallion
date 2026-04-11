import { PageHeader } from "@/components/layout/page-header";
import { DealKanban } from "@/components/crm/deals/deal-kanban";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Deals" description="Track and manage your sales pipeline." />
      <DealKanban />
    </div>
  );
}
