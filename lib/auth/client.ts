import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { auth } from "./index";

export const authClient = createAuthClient({
  plugins: [customSessionClient<typeof auth>()],
});

export const login = async () =>
  await authClient.signIn.social({
    provider: "github",
  });

export const logout = async () => await authClient.signOut();

export const useSession = () => authClient.useSession();

export const getSession = async () => await authClient.getSession();
