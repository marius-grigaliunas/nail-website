import { createHash } from "node:crypto";
import {
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryCloudName,
} from "@/lib/config/env";

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const keys = Object.keys(params).sort();
  const str = keys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return createHash("sha1").update(str).digest("hex");
}

/**
 * Permanently delete a single image asset from Cloudinary (Admin API).
 * Treats `not found` as success so deletes stay idempotent.
 */
export async function destroyCloudinaryImageByPublicId(publicId: string): Promise<void> {
  const timestamp = Math.round(Date.now() / 1000);
  const signPayload: Record<string, string | number> = { public_id: publicId, timestamp };
  const signature = signCloudinaryParams(signPayload, cloudinaryApiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: cloudinaryApiKey,
    timestamp: String(timestamp),
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  const text = await res.text();
  let json: { result?: string; error?: { message?: string } };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(text || `Cloudinary destroy failed (${res.status})`);
  }

  if (!res.ok) {
    const msg = json.error?.message ?? text ?? `Cloudinary destroy failed (${res.status})`;
    throw new Error(msg);
  }

  if (json.result === "ok" || json.result === "not found") {
    return;
  }

  throw new Error(`Unexpected Cloudinary destroy result: ${json.result ?? text}`);
}

export async function destroyCloudinaryImagesByPublicIds(publicIds: string[]): Promise<void> {
  const unique = [...new Set(publicIds)];
  for (const id of unique) {
    await destroyCloudinaryImageByPublicId(id);
  }
}
