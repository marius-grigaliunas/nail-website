import { AppwriteException, ID } from "appwrite";
import { appwriteDatabaseId, appwriteDesignsTableId, hasDesignsTableConfig } from "@/lib/config/env";
import type { DesignCreateInput } from "@/lib/domain/design/types";
import { tables } from "./client";

export async function createDesignRow(data: DesignCreateInput) {
  if (!hasDesignsTableConfig()) {
    throw new AppwriteException(
      "Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DESIGNS_TABLE_ID (or DESIGNS_COLLECTION_ID)",
      400,
      "config",
      "",
    );
  }

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

  return tables.createRow({
    databaseId: appwriteDatabaseId,
    tableId: appwriteDesignsTableId,
    rowId: ID.unique(),
    data: rowData,
  });
}
