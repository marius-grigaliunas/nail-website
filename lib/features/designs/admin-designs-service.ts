import { AppwriteException, Query, TablesDB } from "appwrite";
import {
  appwriteDatabaseId,
  appwriteDesignsTableId,
  cloudinaryCloudName,
  hasCloudinaryDestroyConfig,
} from "@/lib/config/env";
import {
  NAIL_SHAPES,
  type Design,
  type DesignCreateInput,
  type DesignUpdateInput,
  type NailShape,
} from "@/lib/domain/design/types";
import { updateDesignRow } from "@/lib/infra/appwrite/designs-write";
import { destroyCloudinaryImagesByPublicIds } from "@/lib/infra/cloudinary/destroy-server";
import {
  cloudinaryPublicIdFromUrl,
  isCloudinaryDeliveryUrlForCloud,
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

const MAX_NAME_LENGTH = 120;
const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 24;
const MAX_IMAGES = 12;

function parseName(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "Invalid or missing name" };
  }
  const name = value.trim();
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `name must be ${MAX_NAME_LENGTH} characters or fewer` };
  }
  return { ok: true, value: name };
}

function parseShape(value: unknown): { ok: true; value: NailShape } | { ok: false; error: string } {
  if (typeof value !== "string" || !isNailShape(value)) {
    return { ok: false, error: "Invalid or missing shape" };
  }
  return { ok: true, value };
}

function parseTags(value: unknown): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || !value.every((t) => typeof t === "string")) {
    return { ok: false, error: "tags must be an array of strings" };
  }

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value) {
    const tag = raw.trim().replace(/^#/, "");
    if (!tag) continue;
    if (tag.length > MAX_TAG_LENGTH) {
      return { ok: false, error: `tags must be ${MAX_TAG_LENGTH} characters or fewer` };
    }
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }

  if (tags.length > MAX_TAGS) {
    return { ok: false, error: `tags must include ${MAX_TAGS} items or fewer` };
  }

  return { ok: true, value: tags };
}

function parsePrice(value: unknown): { ok: true; value?: number } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true };
  }
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return { ok: false, error: "price must be a non-negative number when provided" };
  }
  return { ok: true, value };
}

function parseCloudinaryUrls(
  value: unknown,
  field: "image_urls" | "thumbnail_urls",
  { required }: { required: boolean },
): { ok: true; value?: string[] } | { ok: false; error: string } {
  if (value === undefined) {
    if (required) return { ok: false, error: `${field} must be an array of strings` };
    return { ok: true };
  }
  if (!Array.isArray(value) || !value.every((u) => typeof u === "string")) {
    return { ok: false, error: `${field} must be an array of strings` };
  }
  if (required && value.length === 0) {
    return { ok: false, error: `${field} must not be empty` };
  }
  if (value.length > MAX_IMAGES) {
    return { ok: false, error: `${field} must include ${MAX_IMAGES} items or fewer` };
  }

  const normalized = value.map((u) => u.trim()).filter(Boolean);
  if (normalized.length !== value.length) {
    return { ok: false, error: `${field} must not include empty URLs` };
  }
  if (!normalized.every((url) => isCloudinaryDeliveryUrlForCloud(url, cloudinaryCloudName))) {
    return { ok: false, error: `${field} must only include this site's Cloudinary image URLs` };
  }
  return { ok: true, value: normalized };
}

function parseDesignMutationBody(
  json: unknown,
): { ok: true; data: DesignCreateInput } | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Expected JSON object body" };
  }
  const o = json as Record<string, unknown>;

  const name = parseName(o.name);
  if (!name.ok) return { ok: false, error: name.error };

  const shape = parseShape(o.shape);
  if (!shape.ok) return { ok: false, error: shape.error };

  const tags = parseTags(o.tags);
  if (!tags.ok) return { ok: false, error: tags.error };

  const imageUrls = parseCloudinaryUrls(o.image_urls, "image_urls", { required: true });
  if (!imageUrls.ok) return { ok: false, error: imageUrls.error };
  const imageUrlList = imageUrls.value;
  if (!imageUrlList || imageUrlList.length === 0) {
    return { ok: false, error: "image_urls must not be empty" };
  }

  const thumbnailUrls = parseCloudinaryUrls(o.thumbnail_urls, "thumbnail_urls", {
    required: false,
  });
  if (!thumbnailUrls.ok) return { ok: false, error: thumbnailUrls.error };

  if (thumbnailUrls.value !== undefined && thumbnailUrls.value.length !== imageUrlList.length) {
    return { ok: false, error: "thumbnail_urls must match image_urls length when provided" };
  }

  const price = parsePrice(o.price);
  if (!price.ok) return { ok: false, error: price.error };

  return {
    ok: true,
    data: {
      name: name.value,
      shape: shape.value,
      tags: tags.value,
      image_urls: imageUrlList,
      ...(price.value !== undefined ? { price: price.value } : {}),
      ...(thumbnailUrls.value !== undefined ? { thumbnail_urls: thumbnailUrls.value } : {}),
    },
  };
}

export function parseAdminDesignCreateBody(json: unknown):
  | { ok: true; data: DesignCreateInput }
  | { ok: false; error: string } {
  return parseDesignMutationBody(json);
}

export function parseAdminDesignUpdateBody(json: unknown):
  | { ok: true; data: DesignUpdateInput }
  | { ok: false; error: string } {
  return parseDesignMutationBody(json);
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

async function getDesignForAdmin(tablesDB: TablesDB, rowId: string): Promise<Design> {
  try {
    const row = await tablesDB.getRow({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      rowId,
    });
    return rowToDesign(row);
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      throw new AdminDesignMutationError("Design not found", 404);
    }
    console.error("[getDesignForAdmin] getRow", err);
    throw new AdminDesignMutationError("Could not load design", 500);
  }
}

function collectRemovedPublicIds(before: Design, after: Design): string[] {
  const beforeUrls = [...before.image_urls, ...(before.thumbnail_urls ?? [])].filter(
    isCloudinaryDeliveryUrl,
  );
  const afterUrls = new Set([...after.image_urls, ...(after.thumbnail_urls ?? [])]);
  const removedPublicIds = beforeUrls
    .filter((url) => !afterUrls.has(url))
    .map(cloudinaryPublicIdFromUrl)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return [...new Set(removedPublicIds)];
}

export async function updateDesignAndCleanupRemovedAssets(
  tablesDB: TablesDB,
  rowId: string,
  data: DesignUpdateInput,
): Promise<{ design: Design; cleanupWarning?: string }> {
  const before = await getDesignForAdmin(tablesDB, rowId);

  let updated: Design;
  try {
    const row = await updateDesignRow(tablesDB, rowId, data);
    updated = rowToDesign(row);
  } catch (err) {
    console.error("[updateDesignAndCleanupRemovedAssets] updateRow", err);
    if (err instanceof AppwriteException) {
      const status = err.code >= 400 && err.code < 600 ? err.code : 500;
      throw new AdminDesignMutationError("Could not update design", status);
    }
    throw new AdminDesignMutationError("Could not update design", 500);
  }

  const removedPublicIds = collectRemovedPublicIds(before, updated);
  if (removedPublicIds.length === 0) {
    return { design: updated };
  }

  if (!hasCloudinaryDestroyConfig()) {
    return {
      design: updated,
      cleanupWarning:
        "Design was updated, but removed Cloudinary assets could not be deleted because server delete credentials are not configured.",
    };
  }

  try {
    await destroyCloudinaryImagesByPublicIds(removedPublicIds);
    return { design: updated };
  } catch (err) {
    console.error("[updateDesignAndCleanupRemovedAssets] Cloudinary destroy", err);
    return {
      design: updated,
      cleanupWarning:
        "Design was updated, but one or more removed Cloudinary assets could not be deleted.",
    };
  }
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
