import { Account, Client, Databases } from "appwrite";
import { appwriteEndpoint, appwriteProjectId } from "./appwrite-config";

const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId);

const account = new Account(client);
const databases = new Databases(client);

export { account, client, databases };
