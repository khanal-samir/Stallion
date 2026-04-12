"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OrgsDataTable } from "@/components/crm/orgs/orgs-data-table";
import { useOrgs } from "@/hooks/queries/use-orgs";

const EMPTY_ORGS: never[] = [];

export default function OrganizationsPage() {
  const { data, isLoading, error, refetch } = useOrgs();
  const orgs = data?.orgs ?? EMPTY_ORGS;
  const count = orgs.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" count={count} />
      <OrgsDataTable orgs={orgs} isLoading={isLoading} error={error} refetch={refetch} />
    </div>
  );
}
