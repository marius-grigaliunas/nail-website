import {
  AdminDesignMutationError,
  deleteDesignAndCloudinaryAssets,
} from "@/lib/features/designs/admin-designs-service";
import { authorizeAdminDesignsRequest } from "@/lib/infra/appwrite/admin-tables-request";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ rowId: string }> },
) {
  const auth = await authorizeAdminDesignsRequest(request);
  if (!auth.ok) return auth.response;

  const { rowId } = await context.params;
  if (!rowId?.trim()) {
    return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  }

  try {
    await deleteDesignAndCloudinaryAssets(auth.tablesDB, rowId);
    return NextResponse.json({ ok: true as const });
  } catch (err) {
    if (err instanceof AdminDesignMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[DELETE /api/admin/designs]", err);
    return NextResponse.json({ error: "Could not delete design" }, { status: 500 });
  }
}
