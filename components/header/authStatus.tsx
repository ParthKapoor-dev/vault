"use client";

import { login, useSession } from "@/lib/auth/client";

import Image from "next/image";

export const AuthStatus = () => {
  const { data, isPending, error } = useSession();
  const user = data?.user;

  if (!user) {
    return (
      <button type="button" onClick={login} className="rounded bg-black px-4 py-2 text-sm text-white hover:opacity-80">
        {isPending ? "Loading..." : "Login"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.name}</span>
      {user.image && <Image src={user.image} alt={user.name} width={20} height={20} className="rounded-full" />}
    </div>
  );
};
