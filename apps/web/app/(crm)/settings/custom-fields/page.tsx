"use client";

import Link from "next/link";
import { Users, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Badge } from "@workspace/ui/components/ui/badge";
import { usePeopleCustomFields, useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";

export default function CustomFieldsLandingPage() {
  const peopleQuery = usePeopleCustomFields();
  const orgQuery = useOrgCustomFields();

  const peopleCount = peopleQuery.data?.length ?? 0;
  const orgCount = orgQuery.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium">Custom fields</h2>
        <p className="text-sm text-muted-foreground">
          Manage workspace-wide custom fields for people and organizations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings/custom-fields/people" className="group">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">People</CardTitle>
                  <CardDescription className="text-xs">Manage people custom fields</CardDescription>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{peopleCount} field{peopleCount === 1 ? "" : "s"}</Badge>
                {peopleQuery.isLoading && (
                  <span className="text-xs text-muted-foreground">Loading…</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/custom-fields/organizations" className="group">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                  <Building2 className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Organizations</CardTitle>
                  <CardDescription className="text-xs">Manage organization custom fields</CardDescription>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{orgCount} field{orgCount === 1 ? "" : "s"}</Badge>
                {orgQuery.isLoading && (
                  <span className="text-xs text-muted-foreground">Loading…</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
