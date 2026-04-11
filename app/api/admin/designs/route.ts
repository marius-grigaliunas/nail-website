import { Query, TablesDB } from "appwrite";
import { getBearerJwt, getUserFromJwt } from "@/lib/appwrite-server";
import { appwriteDatabaseId, appwriteDesignsTableId, hasDesignsTableConfig } from "@/lib/config/env";
import { rowToDesign } from "@/lib/features/designs/mappers";
import { createServerWebClient } from "@/lib/infra/appwrite/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const jwt = getBearerJwt(request);
  if (!jwt) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  try {
    await getUserFromJwt(jwt);
  } catch {
    return NextResponse.json({ error: "Invalid or expired JWT" }, { status: 401 });
  }

  if (!hasDesignsTableConfig()) {
    return NextResponse.json({ error: "Designs table is not configured" }, { status: 503 });
  }

  const client = createServerWebClient().setJWT(jwt);
  const tablesDB = new TablesDB(client);

  try {
    const { rows } = await tablesDB.listRows({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      queries: [Query.orderDesc("$createdAt")],
    });
    return NextResponse.json({ designs: rows.map(rowToDesign) });
  } catch (err) {
    console.error("[GET /api/admin/designs]", err);
    return NextResponse.json({ error: "Could not list designs" }, { status: 500 });
  }
}
