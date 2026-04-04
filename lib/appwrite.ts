import { Account, AppwriteException, Client, Databases, ID } from "appwrite";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import type { DesignCreateInput } from "./designInterface";
import {
  appwriteDatabaseId,
  appwriteDesignsCollectionId,
  appwriteEndpoint,
  appwriteProjectId,
  cloudinaryCloudName,
} from "./appwrite-config";

const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId);

const account = new Account(client);
const databases = new Databases(client);

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
  const body = new FormData();
  body.append("file", file);
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
 * Creates a design row in Appwrite. Requires an active account session and matching collection attributes.
 */
export async function createDesignDocument(data: DesignCreateInput) {
  if (!appwriteDatabaseId || !appwriteDesignsCollectionId) {
    throw new AppwriteException(
      "Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID",
      400,
      "config",
      "",
    );
  }
  const doc: Record<string, unknown> = {
    name: data.name,
    shape: data.shape,
    tags: data.tags,
    image_urls: data.image_urls,
  };
  if (data.price !== undefined) doc.price = data.price;
  if (data.thumbnail_urls !== undefined && data.thumbnail_urls.length > 0) {
    doc.thumbnail_urls = data.thumbnail_urls;
  }
  return databases.createDocument(appwriteDatabaseId, appwriteDesignsCollectionId, ID.unique(), doc);
}

export { account, client, databases };
