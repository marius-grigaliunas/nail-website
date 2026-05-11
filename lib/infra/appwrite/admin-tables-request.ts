import { TablesDB } from "appwrite";
import { getBearerJwt, getUserFromJwt } from "@/lib/appwrite-server";
import {
  appwriteAdminUserIds,
  hasAdminUserAllowlist,
  hasDesignsTableConfig,
} from "@/lib/config/env";
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

  let user: Awaited<ReturnType<typeof getUserFromJwt>>;
  try {
    user = await getUserFromJwt(jwt);
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid or expired JWT" }, { status: 401 }),
    };
  }

  if (!hasAdminUserAllowlist()) {
    console.error("[authorizeAdminDesignsRequest] APPWRITE_ADMIN_USER_IDS is not configured");
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Admin access is not configured" }, { status: 503 }),
    };
  }

  if (!appwriteAdminUserIds.includes(user.$id)) {
    console.warn("[authorizeAdminDesignsRequest] denied non-admin user", { userId: user.$id });
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
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
  return { ok: true as const, tablesDB, user };
}
