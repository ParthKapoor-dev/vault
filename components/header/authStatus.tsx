"use client";

import { login, logout, useSession } from "@/components/providers/session";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { KeyRound } from "lucide-react";
import { Link } from "next-view-transitions";
import Image from "next/image";

export const AuthStatus = () => {
  const { session, isPending } = useSession();

  if (!session) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded bg-black px-4 py-2 text-sm text-white hover:opacity-80 dark:bg-white dark:text-black"
      >
        {isPending ? (
          "Loading..."
        ) : (
          <span className="flex items-center justify-center gap-2">
            Github <GitHubLogoIcon />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {session.isAdmin && (
        <Link
          href="/passwords"
          title="Password vault"
          className="rounded p-1.5 text-gray-8 hover:text-foreground"
        >
          <KeyRound size={16} />
        </Link>
      )}
      <button
        type="button"
        onClick={logout}
        title="Sign out"
        className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-hover"
      >
        <span className="text-muted">{session.name}</span>
        {session.image && (
          <Image
            src={session.image}
            alt={session.name}
            width={20}
            height={20}
            className="rounded-full"
          />
        )}
      </button>
    </div>
  );
};
