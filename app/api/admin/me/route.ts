import { getBearerJwt, getUserFromJwt } from "@/lib/appwrite-server";
import { NextResponse } from "next/server";

/**
 * Example protected route: validates a user JWT, then returns safe user fields.
 * Copy this pattern for uploads and Appwrite writes (verify JWT first, then run logic).
 */
export async function GET(request: Request) {
  const jwt = getBearerJwt(request);
  if (!jwt) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  try {
    const user = await getUserFromJwt(jwt);
    return NextResponse.json({
      ok: true as const,
      userId: user.$id,
      email: user.email,
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired JWT" }, { status: 401 });
  }
}
