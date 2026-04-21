"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { CustomFieldsSettings } from "@/components/workspace/settings/custom-fields-settings";
import { usePeopleCustomFields, useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";

export default function CustomFieldsSettingsPage() {
  const peopleQuery = usePeopleCustomFields();
  const orgsQuery = useOrgCustomFields();

  const isPending = peopleQuery.isPending || orgsQuery.isPending;
  const isError = peopleQuery.isError || orgsQuery.isError;
  const refetch = () => {
    peopleQuery.refetch();
    orgsQuery.refetch();
  };

  if (isPending) {
    return <LoadingState variant="section" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load custom fields"
        description="We couldn't load your custom fields. Please try again."
        onRetry={refetch}
      />
    );
  }

  return <CustomFieldsSettings />;
}
