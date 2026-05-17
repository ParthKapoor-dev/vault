import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/types";

function clear(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const res = NextResponse.redirect(`${siteUrl}/`);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  return clear(req);
}

export async function POST(req: NextRequest) {
  return clear(req);
}
