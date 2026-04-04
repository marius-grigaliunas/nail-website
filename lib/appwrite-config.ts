/** Shared browser + server config (NEXT_PUBLIC_* is available in Route Handlers and Server Actions). */
export const appwriteEndpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
export const appwriteProjectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69d0be920003a1438bbd";

/** Database ID — set in Appwrite console and in `.env` */
export const appwriteDatabaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "";

/**
 * Table ID for the designs table (`TablesDB.listRows`).
 * Falls back to `NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID` if you still use that env name from collections.
 */
export const appwriteDesignsTableId =
  process.env.NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID ??
  process.env.NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID ??
  "";

/** @deprecated Use {@link appwriteDesignsTableId}. Kept for admin `createDocument` config. */
export const appwriteDesignsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_DESIGNS_COLLECTION_ID ?? "";

export const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
