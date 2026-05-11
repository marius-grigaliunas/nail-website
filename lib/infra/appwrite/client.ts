import { Account, Client, TablesDB } from "appwrite";
import { Client as NodeClient } from "node-appwrite";
import { appwriteEndpoint, appwriteProjectId } from "@/lib/config/env";

export const browserClient = new Client().setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
export const account = new Account(browserClient);
export const tables = new TablesDB(browserClient);

export function createServerWebClient() {
  return new Client().setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
}

export function createNodeClientWithJwt(jwt: string): NodeClient {
  return new NodeClient().setEndpoint(appwriteEndpoint).setProject(appwriteProjectId).setJWT(jwt);
}
