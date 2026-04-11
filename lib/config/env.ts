/** Shared browser + server config (NEXT_PUBLIC_* is available in Route Handlers and Server Actions). */
export const appwriteEndpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
export const appwriteProjectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69d0be920003a1438bbd";

/** Database ID — set in Appwrite console and in `.env` */
export const appwriteDatabaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "";

/**
 * Table ID for the designs table (`TablesDB.listRows`).
 * Falls back to `NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID` if still using old env naming.
 */
export const appwriteDesignsTableId =
  process.env.NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID ??
  process.env.NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID ??
  "";

export const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/** Server-only: signed Cloudinary Admin API (e.g. destroy assets). Do not expose to the client. */
export const cloudinaryApiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ?? "";
export const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

export function hasDesignsTableConfig(): boolean {
  return appwriteDatabaseId.length > 0 && appwriteDesignsTableId.length > 0;
}

export function hasCloudinaryDestroyConfig(): boolean {
  return (
    cloudinaryCloudName.length > 0 &&
    cloudinaryApiKey.length > 0 &&
    cloudinaryApiSecret.length > 0
  );
}
