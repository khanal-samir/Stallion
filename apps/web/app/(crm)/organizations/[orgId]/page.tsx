import { OrgDetailPage } from "@/components/crm/org/org-detail-page";

export default async function OrganizationDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { orgId } = await params;
  const { edit } = await searchParams;
  return <OrgDetailPage orgId={orgId} startInEditMode={edit === "true"} />;
}
