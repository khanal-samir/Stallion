"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PeopleDataTable } from "@/components/crm/people/people-data-table";
import { usePeople } from "@/hooks/queries/use-people";

export default function PeoplePage() {
  const { data } = usePeople();
  const count = data?.people?.length;

  return (
    <div className="space-y-6">
      <PageHeader title="People" count={count} />
      <PeopleDataTable />
    </div>
  );
}
