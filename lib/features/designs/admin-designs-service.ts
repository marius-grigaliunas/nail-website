import { AppwriteException, Query, TablesDB } from "appwrite";
import {
  appwriteDatabaseId,
  appwriteDesignsTableId,
  hasCloudinaryDestroyConfig,
} from "@/lib/config/env";
import {
  NAIL_SHAPES,
  type Design,
  type DesignCreateInput,
  type NailShape,
} from "@/lib/domain/design/types";
import { destroyCloudinaryImagesByPublicIds } from "@/lib/infra/cloudinary/destroy-server";
import {
  cloudinaryPublicIdFromUrl,
  isCloudinaryDeliveryUrl,
} from "@/lib/infra/cloudinary/public-id";
import { rowToDesign } from "./mappers";

export class AdminDesignMutationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminDesignMutationError";
  }
}

function isNailShape(s: string): s is NailShape {
  return (NAIL_SHAPES as readonly string[]).includes(s);
}

export function parseAdminDesignCreateBody(json: unknown):
  | { ok: true; data: DesignCreateInput }
  | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Expected JSON object body" };
  }
  const o = json as Record<string, unknown>;

  if (typeof o.name !== "string" || !o.name.trim()) {
    return { ok: false, error: "Invalid or missing name" };
  }
  if (typeof o.shape !== "string" || !isNailShape(o.shape)) {
    return { ok: false, error: "Invalid or missing shape" };
  }
  if (!Array.isArray(o.tags) || !o.tags.every((t) => typeof t === "string")) {
    return { ok: false, error: "tags must be an array of strings" };
  }
  if (!Array.isArray(o.image_urls) || !o.image_urls.every((u) => typeof u === "string")) {
    return { ok: false, error: "image_urls must be an array of strings" };
  }
  if (o.image_urls.length === 0) {
    return { ok: false, error: "image_urls must not be empty" };
  }

  let price: number | undefined;
  if (o.price !== undefined) {
    if (typeof o.price !== "number" || Number.isNaN(o.price) || o.price < 0) {
      return { ok: false, error: "price must be a non-negative number when provided" };
    }
    price = o.price;
  }

  let thumbnail_urls: string[] | undefined;
  if (o.thumbnail_urls !== undefined) {
    if (
      !Array.isArray(o.thumbnail_urls) ||
      !o.thumbnail_urls.every((u) => typeof u === "string")
    ) {
      return { ok: false, error: "thumbnail_urls must be an array of strings when provided" };
    }
    thumbnail_urls = o.thumbnail_urls;
  }

  const data: DesignCreateInput = {
    name: o.name.trim(),
    shape: o.shape,
    tags: o.tags,
    image_urls: o.image_urls,
    ...(price !== undefined ? { price } : {}),
    ...(thumbnail_urls !== undefined ? { thumbnail_urls } : {}),
  };

  return { ok: true, data };
}

export async function listDesignsForAdmin(tablesDB: TablesDB): Promise<Design[]> {
  const { rows } = await tablesDB.listRows({
    databaseId: appwriteDatabaseId,
    tableId: appwriteDesignsTableId,
    queries: [Query.orderDesc("$createdAt")],
  });
  return rows.map(rowToDesign);
}

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

/**
 * Deletes Cloudinary assets for the row (if any), then removes the Appwrite row.
 * Throws {@link AdminDesignMutationError} for expected HTTP-level failures.
 */
export async function deleteDesignAndCloudinaryAssets(
  tablesDB: TablesDB,
  rowId: string,
): Promise<void> {
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
      throw new AdminDesignMutationError("Design not found", 404);
    }
    console.error("[deleteDesignAndCloudinaryAssets] getRow", err);
    throw new AdminDesignMutationError("Could not load design", 500);
  }

  const { publicIds, error: parseError } = collectCloudinaryPublicIds(design);
  if (parseError) {
    throw new AdminDesignMutationError(parseError, 422);
  }

  if (publicIds.length > 0) {
    if (!hasCloudinaryDestroyConfig()) {
      throw new AdminDesignMutationError(
        "Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server to delete Cloudinary assets.",
        503,
      );
    }
    try {
      await destroyCloudinaryImagesByPublicIds(publicIds);
    } catch (err) {
      console.error("[deleteDesignAndCloudinaryAssets] Cloudinary destroy", err);
      const message = err instanceof Error ? err.message : "Cloudinary delete failed";
      throw new AdminDesignMutationError(message, 502);
    }
  }

  try {
    await tablesDB.deleteRow({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      rowId,
    });
  } catch (err) {
    console.error("[deleteDesignAndCloudinaryAssets] deleteRow", err);
    if (err instanceof AppwriteException) {
      const status = err.code >= 400 && err.code < 600 ? err.code : 500;
      throw new AdminDesignMutationError(err.message, status);
    }
    throw new AdminDesignMutationError("Could not delete design row", 500);
  }
}
