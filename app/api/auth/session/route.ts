import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/** JSON session endpoint consumed by the client SessionProvider. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json(session, {
    headers: { "Cache-Control": "no-store" },
  });
}
