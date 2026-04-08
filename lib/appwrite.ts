import { Account, AppwriteException, Client, ID, TablesDB } from "appwrite";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { compressImage } from "./compress-image";
import type { DesignCreateInput } from "./designInterface";
import {
  appwriteDatabaseId,
  appwriteDesignsTableId,
  appwriteEndpoint,
  appwriteProjectId,
  cloudinaryCloudName,
} from "./appwrite-config";

const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId);

const account = new Account(client);
const tables = new TablesDB(client);

/** Unsigned upload preset configured in Cloudinary for nail design images */
export const CLOUDINARY_NAIL_DESIGN_UPLOAD_PRESET = "nail design" as const;

/** Normalized asset fields for Appwrite `image_urls` / previews after an upload */
export type NailDesignCloudinaryAsset = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
};

function assetFromCloudinaryJson(json: Record<string, unknown>): NailDesignCloudinaryAsset {
  const publicId = json.public_id;
  const secureUrl = json.secure_url;
  if (typeof publicId !== "string" || typeof secureUrl !== "string") {
    throw new Error("Invalid Cloudinary upload response");
  }
  return {
    publicId,
    secureUrl,
    width: typeof json.width === "number" ? json.width : undefined,
    height: typeof json.height === "number" ? json.height : undefined,
    format: typeof json.format === "string" ? json.format : undefined,
  };
}

/**
 * Upload a single image file to Cloudinary (unsigned preset). Use when saving a design so uploads
 * start together with Appwrite persistence.
 */
export async function uploadNailDesignFileToCloudinary(file: File): Promise<NailDesignCloudinaryAsset> {
  if (!cloudinaryCloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
  }

  const compressed = await compressImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const compressedFile = new File([compressed], `${baseName}.webp`, { type: "image/webp" });

  const body = new FormData();
  body.append("file", compressedFile);
  body.append("upload_preset", CLOUDINARY_NAIL_DESIGN_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
    { method: "POST", body },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Cloudinary upload failed (${res.status})`);
  }
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON from Cloudinary");
  }
  return assetFromCloudinaryJson(json);
}

/**
 * Call from the Cloudinary upload widget `onSuccess` when an image finishes uploading.
 * Returns data you can store on the design document (e.g. `image_urls`) or show in the form.
 */
export function handleNailDesignCloudinaryUpload(
  info: CloudinaryUploadWidgetInfo,
): NailDesignCloudinaryAsset {
  return {
    publicId: info.public_id,
    secureUrl: info.secure_url,
    width: info.width,
    height: info.height,
    format: info.format,
  };
}

/**
 * Creates a design row via Tables API (`TablesDB.createRow`). Requires an active session and
 * matching table columns (`name`, `shape`, `tags`, `image_urls`, optional `price`, `thumbnail_urls`).
 */
export async function createDatabaseRow(data: DesignCreateInput) {
  if (!appwriteDatabaseId || !appwriteDesignsTableId) {
    throw new AppwriteException(
      "Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID (or DESIGNS_COLLECTION_ID)",
      400,
      "config",
      "",
    );
  }

  const rowData: Record<string, unknown> = {
    name: data.name,
    shape: data.shape,
    tags: data.tags,
    image_urls: data.image_urls,
  };
  if (data.price !== undefined) rowData.price = data.price;
  if (data.thumbnail_urls !== undefined && data.thumbnail_urls.length > 0) {
    rowData.thumbnail_urls = data.thumbnail_urls;
  }

  let rowId = ID.unique() 
  console.log("createDatabaseRow called", new Date().toISOString(), rowId);

  return tables.createRow({
    databaseId: appwriteDatabaseId,
    tableId: appwriteDesignsTableId,
    rowId: rowId,
    data: rowData,
  });

  
}

export { account, client, tables };
