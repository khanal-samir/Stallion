"use client";
import { useSession, signOut } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return <div>Loading...</div>;

  const user = session?.user;
  console.log("User session:", session);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Email: {user?.email}</p>
        <p>ID: {user?.id}</p>
        {user?.image && (
          <Image src={user.image} alt="User avatar" className="w-16 h-16 rounded-full" />
        )}
      </div>
      <button
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Sign out
      </button>
    </div>
  );
}
