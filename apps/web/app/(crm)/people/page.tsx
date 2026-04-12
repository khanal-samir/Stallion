"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PeopleDataTable } from "@/components/crm/people/people-data-table";
import { usePeople } from "@/hooks/queries/use-people";

const EMPTY_PEOPLE: never[] = [];

export default function PeoplePage() {
  const { data, isLoading, error, refetch } = usePeople();
  const people = data?.people ?? EMPTY_PEOPLE;
  const count = people.length;

  return (
    <div className="space-y-6">
      <PageHeader title="People" count={count} />
      <PeopleDataTable people={people} isLoading={isLoading} error={error} refetch={refetch} />
    </div>
  );
}
