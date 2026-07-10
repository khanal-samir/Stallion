import { UnsubscribeConfirmation } from "@/components/sequences/unsubscribe-confirmation";

export default async function UnsubscribeRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <UnsubscribeConfirmation token={token} />;
}
