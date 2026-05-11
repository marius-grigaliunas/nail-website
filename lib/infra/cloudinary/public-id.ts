/**
 * Extract Cloudinary `public_id` (folder path, no file extension) from a delivery URL.
 * Handles optional transformation segments and `v123` version folders.
 */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const uploadIndex = segments.indexOf("upload");
  if (uploadIndex === -1) return null;

  let i = uploadIndex + 1;
  while (i < segments.length) {
    const seg = segments[i];
    if (seg.includes(",")) {
      i++;
      continue;
    }
    if (/^v\d+$/u.test(seg)) {
      i++;
      continue;
    }
    break;
  }

  if (i >= segments.length) return null;

  const pathWithExt = segments.slice(i).join("/");
  const lastDot = pathWithExt.lastIndexOf(".");
  const withoutExt = lastDot > 0 ? pathWithExt.slice(0, lastDot) : pathWithExt;
  return withoutExt.length > 0 ? withoutExt : null;
}

export function isCloudinaryDeliveryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

export function isCloudinaryDeliveryUrlForCloud(url: string, cloudName: string): boolean {
  if (!cloudName) return false;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      segments[0] === cloudName &&
      segments[1] === "image" &&
      segments[2] === "upload"
    );
  } catch {
    return false;
  }
}
