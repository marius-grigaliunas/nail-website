/** Shared browser + server config (NEXT_PUBLIC_* is available in Route Handlers and Server Actions). */
export const appwriteEndpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
export const appwriteProjectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69d0be920003a1438bbd";
