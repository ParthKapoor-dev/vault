import { NextRequest, NextResponse } from "next/server";
import { signSession } from "@/lib/auth/session";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type Session,
} from "@/lib/auth/types";

const GH_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "vault-app",
});

/** GitHub redirects here with ?code&state. Exchanges the code for a session. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const fail = () => NextResponse.redirect(`${siteUrl}/?error=auth`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // CSRF: the state echoed back by GitHub must match the one we issued.
  if (!code || !state || !storedState || state !== storedState) {
    return fail();
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${siteUrl}/api/auth/callback`,
        }),
      },
    );
    const tokenJson = await tokenRes.json();
    const accessToken: string | undefined = tokenJson.access_token;
    if (!accessToken) return fail();

    const ghUser = await fetch("https://api.github.com/user", {
      headers: GH_HEADERS(accessToken),
    }).then((r) => r.json());

    // The /user email is often null; the primary verified email lives here.
    let email: string | null = ghUser.email ?? null;
    if (!email) {
      const emails = await fetch("https://api.github.com/user/emails", {
        headers: GH_HEADERS(accessToken),
      }).then((r) => r.json());
      if (Array.isArray(emails)) {
        const primary =
          emails.find((e) => e.primary && e.verified) ??
          emails.find((e) => e.verified);
        email = primary?.email ?? null;
      }
    }

    const session: Session = {
      login: ghUser.login ?? "",
      name: ghUser.name ?? ghUser.login ?? "",
      email: email ?? "",
      image: ghUser.avatar_url ?? "",
      isAdmin: !!email && email === process.env.GITHUB_ADMIN_EMAIL,
    };

    const token = await signSession(session);
    const res = NextResponse.redirect(`${siteUrl}/`);
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return fail();
  }
}
