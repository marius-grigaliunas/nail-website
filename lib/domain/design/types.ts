export type NailShape =
  | "round"
  | "oval"
  | "square"
  | "squoval"
  | "almond"
  | "coffin"
  | "stiletto"
  | "lipstick";

/** Display order for forms and filters */
export const NAIL_SHAPES: readonly NailShape[] = [
  "round",
  "oval",
  "square",
  "squoval",
  "almond",
  "coffin",
  "stiletto",
  "lipstick",
];

export interface Design {
  $id: string;
  name: string;
  shape: NailShape;
  price?: number;
  tags: string[];
  thumbnail_urls?: string[];
  image_urls: string[];
  /** Render-ready image list (prefers thumbnails). */
  display_urls: string[];
  /** ISO 8601 datetime */
  $createdAt: string;
  /** ISO 8601 datetime */
  $updatedAt: string;
}

/** Payload for create row APIs — Appwrite fills `$id`, `$createdAt`, `$updatedAt`. */
export type DesignCreateInput = {
  name: string;
  shape: NailShape;
  tags: string[];
  image_urls: string[];
  price?: number;
  thumbnail_urls?: string[];
};
