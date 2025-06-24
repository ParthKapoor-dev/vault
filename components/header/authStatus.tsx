"use client";

import { login, logout, useSession } from "@/lib/auth/client";

import Image from "next/image";
import { useEffect, useState } from "react";

export const AuthStatus = () => {
  const { data, isPending, error } = useSession();
  const user = data?.user;

  if (!user) {
    return (
      <button
        onClick={login}
        className="text-sm px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        {isPending ? "Loading..." : "Login"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.name}</span>
      {user.image && (
        <Image
          src={user.image}
          alt={user.name}
          width={20}
          height={20}
          className="rounded-full"
        />
      )}
    </div>
  );
};
