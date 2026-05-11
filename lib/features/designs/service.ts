import { Query, TablesDB } from "appwrite";
import { appwriteDatabaseId, appwriteDesignsTableId, hasDesignsTableConfig } from "@/lib/config/env";
import type { Design } from "@/lib/domain/design/types";
import { createServerWebClient } from "@/lib/infra/appwrite/client";
import { rowToDesign } from "./mappers";

export async function listDesignsForGallery(): Promise<Design[]> {
  if (!hasDesignsTableConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[listDesignsForGallery] Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID (or DESIGNS_COLLECTION_ID) to load designs.",
      );
    }
    return [];
  }

  const tablesDB = new TablesDB(createServerWebClient());
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
