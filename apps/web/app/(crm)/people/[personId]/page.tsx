import { PersonDetailPage } from "@/components/crm/people/person-detail-page";

export default async function PersonDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { personId } = await params;
  const { edit } = await searchParams;
  return <PersonDetailPage personId={personId} startInEditMode={edit === "true"} />;
}
