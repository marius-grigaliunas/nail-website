import { AppwriteException } from "appwrite";
import { rowToDesign } from "@/lib/features/designs/mappers";
import {
  listDesignsForAdmin,
  parseAdminDesignCreateBody,
} from "@/lib/features/designs/admin-designs-service";
import { authorizeAdminDesignsRequest } from "@/lib/infra/appwrite/admin-tables-request";
import { createDesignRow } from "@/lib/infra/appwrite/designs-write";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await authorizeAdminDesignsRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const designs = await listDesignsForAdmin(auth.tablesDB);
    return NextResponse.json({ designs });
  } catch (err) {
    console.error("[GET /api/admin/designs]", err);
    return NextResponse.json({ error: "Could not list designs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminDesignsRequest(request);
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseAdminDesignCreateBody(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const row = await createDesignRow(auth.tablesDB, parsed.data);
    return NextResponse.json({ design: rowToDesign(row) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/designs]", err);
    if (err instanceof AppwriteException) {
      const status = err.code >= 400 && err.code < 600 ? err.code : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: "Could not create design" }, { status: 500 });
  }
}
