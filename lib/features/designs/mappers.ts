import { type Models } from "appwrite";
import { type Design, NAIL_SHAPES, type NailShape } from "@/lib/domain/design/types";

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      // ignore malformed serialized arrays
    }
  }
  return [];
}

function isNailShape(s: string): s is NailShape {
  return (NAIL_SHAPES as readonly string[]).includes(s);
}

export function rowToDesign(row: Models.Row): Design {
  const raw = row as Record<string, unknown>;
  const shapeRaw = typeof raw.shape === "string" ? raw.shape : "round";
  const shape = isNailShape(shapeRaw) ? shapeRaw : "round";
  const image_urls = parseStringArray(raw.image_urls);
  const thumbParsed = parseStringArray(raw.thumbnail_urls);
  const thumbnail_urls = thumbParsed.length > 0 ? thumbParsed : undefined;
  const tags = parseStringArray(raw.tags);
  const price =
    typeof raw.price === "number" && !Number.isNaN(raw.price) ? raw.price : undefined;
  const name = typeof raw.name === "string" ? raw.name : "Untitled";
  const display_urls = thumbnail_urls && thumbnail_urls.length > 0 ? thumbnail_urls : image_urls;
  return {
    $id: row.$id,
    name,
    shape,
    price,
    tags,
    thumbnail_urls,
    image_urls,
    display_urls,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
  };
}
