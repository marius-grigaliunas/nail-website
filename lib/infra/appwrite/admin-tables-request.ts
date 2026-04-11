import { TablesDB } from "appwrite";
import { getBearerJwt, getUserFromJwt } from "@/lib/appwrite-server";
import { hasDesignsTableConfig } from "@/lib/config/env";
import { createServerWebClient } from "@/lib/infra/appwrite/client";
import { NextResponse } from "next/server";

/**
 * Validates admin JWT and returns a {@link TablesDB} client scoped to that user.
 * Used by all `/api/admin/designs` route handlers for a single auth path.
 */
export async function authorizeAdminDesignsRequest(request: Request) {
  const jwt = getBearerJwt(request);
  if (!jwt) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 }),
    };
  }

  try {
    await getUserFromJwt(jwt);
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid or expired JWT" }, { status: 401 }),
    };
  }

  if (!hasDesignsTableConfig()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Designs table is not configured" }, { status: 503 }),
    };
  }

  const client = createServerWebClient().setJWT(jwt);
  const tablesDB = new TablesDB(client);
  return { ok: true as const, tablesDB };
}
