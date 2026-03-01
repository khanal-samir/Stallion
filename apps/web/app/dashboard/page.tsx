"use client";
import { useSignOut } from "@/hooks/use-auth";
import { useSession } from "@/lib/auth-client";

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const { signOut } = useSignOut();

  if (isPending) return <div>Loading...</div>;

  const user = session?.user;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Email: {user?.email}</p>
        <p>ID: {user?.id}</p>
      </div>
      <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded">
        Sign out
      </button>
    </div>
  );
}
