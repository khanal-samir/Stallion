"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { CustomFieldsSettings } from "@/components/workspace/settings/custom-fields-settings";
import { usePeopleCustomFields, useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";

export default function CustomFieldsSettingsPage() {
  const peopleQuery = usePeopleCustomFields();
  const orgQuery = useOrgCustomFields();

  const isPending = peopleQuery.isPending || orgQuery.isPending;
  const isError = peopleQuery.isError || orgQuery.isError;
  const refetch = () => {
    peopleQuery.refetch();
    orgQuery.refetch();
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
