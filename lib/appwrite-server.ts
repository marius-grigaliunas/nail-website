import { Account, type Client as NodeClient } from "node-appwrite";
import { createNodeClientWithJwt } from "@/lib/infra/appwrite/client";
export { rowToDesign } from "@/lib/features/designs/mappers";
export { listDesignsForGallery } from "@/lib/features/designs/service";

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
  return createNodeClientWithJwt(jwt);
}

/**
 * Returns the current Appwrite user for a short-lived user JWT.
 * Use inside Route Handlers / Server Actions after extracting the JWT from the request.
 */
export async function getUserFromJwt(jwt: string) {
  const account = new Account(createClientWithJwt(jwt));
  return account.get();
}
