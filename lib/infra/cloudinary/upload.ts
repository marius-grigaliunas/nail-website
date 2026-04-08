import { cloudinaryCloudName } from "@/lib/config/env";
import { compressImage } from "@/lib/compress-image";

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
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body,
  });
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
