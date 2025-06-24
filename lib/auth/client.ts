import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const login = async () => {
  const data = await authClient.signIn.social({
    provider: "github",
  });
  console.log(data);
};

export const logout = async () => {
  await authClient.signOut();
};

export const useSession = () => {
  return authClient.useSession();
};

export const getSession = async () => {
  return await authClient.getSession();
};
