"use client";

import { client } from "@/lib/appwrite";
import { useEffect } from "react";

export function AppwritePing() {
  useEffect(() => {
    void client.ping();
  }, []);

  return null;
}
