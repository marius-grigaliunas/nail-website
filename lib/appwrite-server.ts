import { Account, Client as NodeClient } from "node-appwrite";
import { Client, Query, TablesDB, type Models } from "appwrite";
import type { Design, NailShape } from "./designInterface";
import { NAIL_SHAPES } from "./designInterface";
import {
  appwriteDatabaseId,
  appwriteDesignsTableId,
  appwriteEndpoint,
  appwriteProjectId,
} from "./appwrite-config";

/**
 * Reads `Authorization: Bearer <jwt>` from a Request (Route Handler, middleware).
 * Use the JWT from `account.createJWT()` on the client for server-side calls.
 */
export function getBearerJwt(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

function createClientWithJwt(jwt: string): NodeClient {
  return new NodeClient()
    .setEndpoint(appwriteEndpoint)
    .setProject(appwriteProjectId)
    .setJWT(jwt);
}

/**
 * Returns the current Appwrite user for a short-lived user JWT.
 * Use inside Route Handlers / Server Actions after extracting the JWT from the request.
 */
export async function getUserFromJwt(jwt: string) {
  const account = new Account(createClientWithJwt(jwt));
  return account.get();
}

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
      /* ignore */
    }
  }
  return [];
}

function isNailShape(s: string): s is NailShape {
  return (NAIL_SHAPES as readonly string[]).includes(s);
}

/** Maps an Appwrite table row to {@link Design}. */
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
  return {
    $id: row.$id,
    name,
    shape,
    price,
    tags,
    thumbnail_urls,
    image_urls,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
  };
}

/**
 * Lists all designs for the public gallery (newest first).
 * Uses the Appwrite web SDK (`TablesDB.listRows`) with no API key — grant **read** on the table
 * for `any` (or your chosen role) in Appwrite so unauthenticated requests can list rows.
 */
export async function listDesignsForGallery(): Promise<Design[]> {
  if (!appwriteDatabaseId || !appwriteDesignsTableId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[listDesignsForGallery] Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID (or DESIGNS_COLLECTION_ID) to load designs.",
      );
    }
    return [];
  }

  const client = new Client().setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
  const tablesDB = new TablesDB(client);

  try {
    const { rows } = await tablesDB.listRows({
      databaseId: appwriteDatabaseId,
      tableId: appwriteDesignsTableId,
      queries: [Query.orderDesc("$createdAt")],
    });
    return rows.map(rowToDesign);
  } catch (err) {
    console.error("[listDesignsForGallery]", err);
    return [];
  }
}
