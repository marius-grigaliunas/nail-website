import { AppwriteException, ID, type TablesDB } from "appwrite";
import { appwriteDatabaseId, appwriteDesignsTableId, hasDesignsTableConfig } from "@/lib/config/env";
import type { DesignCreateInput, DesignUpdateInput } from "@/lib/domain/design/types";

function designRowData(data: DesignCreateInput | DesignUpdateInput): Record<string, unknown> {
  const rowData: Record<string, unknown> = {
    name: data.name,
    shape: data.shape,
    tags: data.tags,
    image_urls: data.image_urls,
  };
  if (data.price !== undefined) rowData.price = data.price;
  if (data.thumbnail_urls && data.thumbnail_urls.length > 0) {
    rowData.thumbnail_urls = data.thumbnail_urls;
  }
  return rowData;
}

function designUpdateRowData(data: DesignUpdateInput): Record<string, unknown> {
  return {
    ...designRowData(data),
    price: data.price ?? null,
    thumbnail_urls: data.thumbnail_urls ?? [],
  };
}

function assertDesignsTableConfig() {
  if (!hasDesignsTableConfig()) {
    throw new AppwriteException(
      "Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID (or DESIGNS_COLLECTION_ID)",
      400,
      "config",
      "",
    );
  }
}

/**
 * Inserts a designs table row using the given {@link TablesDB} client (browser session or JWT on the server).
 * Callers must ensure {@link hasDesignsTableConfig} before invoking (e.g. after {@link authorizeAdminDesignsRequest}).
 */
export async function createDesignRow(tablesDB: TablesDB, data: DesignCreateInput) {
  assertDesignsTableConfig();

  return tablesDB.createRow({
    databaseId: appwriteDatabaseId,
    tableId: appwriteDesignsTableId,
    rowId: ID.unique(),
    data: designRowData(data),
  });
}

export async function updateDesignRow(
  tablesDB: TablesDB,
  rowId: string,
  data: DesignUpdateInput,
) {
  assertDesignsTableConfig();

  return tablesDB.updateRow({
    databaseId: appwriteDatabaseId,
    tableId: appwriteDesignsTableId,
    rowId,
    data: designUpdateRowData(data),
  });
}
