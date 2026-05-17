import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/types";

/** Kicks off GitHub OAuth: stores a CSRF state cookie and redirects to GitHub. */
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || "",
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: "read:user user:email",
    state,
    allow_signup: "false",
  });

  const res = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
