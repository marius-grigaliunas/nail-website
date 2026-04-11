import { AppwriteException, TablesDB } from "appwrite";
import { getBearerJwt, getUserFromJwt, rowToDesign } from "@/lib/appwrite-server";
import {
  appwriteDatabaseId,
  appwriteDesignsTableId,
  hasCloudinaryDestroyConfig,
  hasDesignsTableConfig,
} from "@/lib/config/env";
import type { Design } from "@/lib/domain/design/types";
import { createServerWebClient } from "@/lib/infra/appwrite/client";
import { destroyCloudinaryImagesByPublicIds } from "@/lib/infra/cloudinary/destroy-server";
import {
  cloudinaryPublicIdFromUrl,
  isCloudinaryDeliveryUrl,
} from "@/lib/infra/cloudinary/public-id";
import { NextResponse } from "next/server";

function collectCloudinaryPublicIds(design: Design): { publicIds: string[]; error?: string } {
  const urls = [...design.image_urls, ...(design.thumbnail_urls ?? [])];
  const cloudinaryUrls = urls.filter(isCloudinaryDeliveryUrl);
  if (cloudinaryUrls.length === 0) {
    return { publicIds: [] };
  }

  const publicIds: string[] = [];
  for (const url of cloudinaryUrls) {
    const pid = cloudinaryPublicIdFromUrl(url);
    if (!pid) {
      return {
        publicIds: [],
        error: "Stored design URLs include Cloudinary links that could not be parsed for deletion.",
      };
    }
    publicIds.push(pid);
  }

  return { publicIds: [...new Set(publicIds)] };
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ rowId: string }> },
) {
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

  const { rowId } = await context.params;
  if (!rowId?.trim()) {
    return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  }

  const client = createServerWebClient().setJWT(jwt);
  const tablesDB = new TablesDB(client);

  let design: Design;
  try {
    const row = await tablesDB.getRow({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      rowId,
    });
    design = rowToDesign(row);
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/designs] getRow", err);
    return NextResponse.json({ error: "Could not load design" }, { status: 500 });
  }

  const { publicIds, error: parseError } = collectCloudinaryPublicIds(design);
  if (parseError) {
    return NextResponse.json({ error: parseError }, { status: 422 });
  }

  if (publicIds.length > 0) {
    if (!hasCloudinaryDestroyConfig()) {
      return NextResponse.json(
        {
          error:
            "Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server to delete Cloudinary assets.",
        },
        { status: 503 },
      );
    }
    try {
      await destroyCloudinaryImagesByPublicIds(publicIds);
    } catch (err) {
      console.error("[DELETE /api/admin/designs] Cloudinary destroy", err);
      const message = err instanceof Error ? err.message : "Cloudinary delete failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    await tablesDB.deleteRow({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      rowId,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/designs] deleteRow", err);
    if (err instanceof AppwriteException) {
      return NextResponse.json({ error: err.message }, { status: err.code >= 400 ? err.code : 500 });
    }
    return NextResponse.json({ error: "Could not delete design row" }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
