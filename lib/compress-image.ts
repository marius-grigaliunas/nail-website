const DESIGN_THUMBNAIL_SIZE = 600;
/** Target WebP thumbnail size band (bytes); quality is reduced until under max. */
const THUMB_WEBP_MAX_BYTES = 50 * 1024;

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

/**
 * 600×600 center-cropped “cover” WebP thumbnail for grid/list use.
 * Tries encoding qualities from high to low so the file usually lands in ~10–50 KB for photos.
 */
export async function createDesignThumbnailWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (iw < 1 || ih < 1) {
        reject(new Error("Invalid image dimensions for thumbnail"));
        return;
      }

      const scale = Math.max(DESIGN_THUMBNAIL_SIZE / iw, DESIGN_THUMBNAIL_SIZE / ih);
      const cropW = DESIGN_THUMBNAIL_SIZE / scale;
      const cropH = DESIGN_THUMBNAIL_SIZE / scale;
      const sx = (iw - cropW) / 2;
      const sy = (ih - cropH) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = DESIGN_THUMBNAIL_SIZE;
      canvas.height = DESIGN_THUMBNAIL_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, DESIGN_THUMBNAIL_SIZE, DESIGN_THUMBNAIL_SIZE);

      let quality = 0.82;
      const minQuality = 0.28;
      let lastBlob: Blob | null = null;

      while (quality >= minQuality - 1e-6) {
        const blob = await canvasToWebpBlob(canvas, quality);
        if (!blob) {
          reject(new Error("Thumbnail encoding failed"));
          return;
        }
        lastBlob = blob;
        if (blob.size <= THUMB_WEBP_MAX_BYTES) {
          resolve(blob);
          return;
        }
        quality -= 0.07;
      }

      if (lastBlob) {
        resolve(lastBlob);
        return;
      }
      reject(new Error("Thumbnail encoding failed"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an image file in the browser using the Canvas API.
 * Resizes to at most `maxWidth` pixels wide (preserving aspect ratio, never enlarges),
 * then encodes as WebP at the given quality (0–1).
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed"));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}
