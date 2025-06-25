import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const isAdmin = user.email === "pkapoor_be22@thapar.edu";
      return {
        user: {
          ...user,
          isAdmin,
        },
        session,
      };
    }),
  ],
});

export const getSession = async (headers: Headers) =>
  await auth.api.getSession({ headers });
