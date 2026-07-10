import { SequenceDetailWorkspace } from "@/components/sequences/sequence-detail-workspace";

export default async function SequenceDetailRoute({
  params,
}: {
  params: Promise<{ sequenceId: string }>;
}) {
  const { sequenceId } = await params;
  return <SequenceDetailWorkspace sequenceId={sequenceId} />;
}
