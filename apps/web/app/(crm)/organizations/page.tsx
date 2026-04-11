"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OrgsDataTable } from "@/components/crm/orgs/orgs-data-table";
import { useOrgs } from "@/hooks/queries/use-orgs";

export default function OrganizationsPage() {
  const { data } = useOrgs();
  const count = data?.orgs?.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" count={count} />
      <OrgsDataTable />
    </div>
  );
}
