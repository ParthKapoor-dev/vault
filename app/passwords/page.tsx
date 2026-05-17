import { getSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { PasswordVault } from "@/components/passwords";

// Always private — only the admin may reach the vault.
export const dynamic = "force-dynamic";

export default async function PasswordsPage() {
  const session = await getSession();
  if (!session?.isAdmin) {
    notFound();
  }
  return <PasswordVault />;
}
