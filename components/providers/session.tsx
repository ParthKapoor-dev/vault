"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@/lib/auth/types";

interface SessionContextValue {
  session: Session | null;
  isPending: boolean;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isPending: true,
  refresh: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  const refresh = useCallback(() => {
    setIsPending(true);
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: Session | null) => setSession(data))
      .catch(() => setSession(null))
      .finally(() => setIsPending(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ session, isPending, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);

export const login = () => {
  window.location.href = "/api/auth/login";
};

export const logout = () => {
  window.location.href = "/api/auth/logout";
};
