import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { createDesignRow } from "@/lib/infra/appwrite/designs-write";
import { account, browserClient as client, tables } from "@/lib/infra/appwrite/client";
import type { DesignCreateInput } from "@/lib/domain/design/types";
import {
  CLOUDINARY_NAIL_DESIGN_UPLOAD_PRESET,
  type NailDesignCloudinaryAsset,
  type NailDesignUploadWithThumbnail,
  uploadNailDesignFileToCloudinary,
  uploadNailDesignFileWithThumbnail,
} from "@/lib/infra/cloudinary/upload";

export { CLOUDINARY_NAIL_DESIGN_UPLOAD_PRESET };

/**
 * Upload a single image file to Cloudinary (unsigned preset). Use when saving a design so uploads
 * start together with Appwrite persistence.
 */
export { uploadNailDesignFileToCloudinary, uploadNailDesignFileWithThumbnail };
export type { NailDesignUploadWithThumbnail };

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
  return createDesignRow(data);
}

export { account, client, tables };
