import { authorizeAdminDesignsRequest } from "@/lib/infra/appwrite/admin-tables-request";
import { NextResponse } from "next/server";

/**
 * Validates a user JWT and the server-side admin allowlist, then returns safe user fields.
 */
export async function GET(request: Request) {
  const auth = await authorizeAdminDesignsRequest(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ok: true as const,
    userId: auth.user.$id,
    email: auth.user.email,
  });
}
