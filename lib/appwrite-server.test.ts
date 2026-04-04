import { describe, expect, it } from "vitest";
import { getBearerJwt } from "./appwrite-server";

describe("getBearerJwt", () => {
  it("returns token for Bearer header", () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: "Bearer abc.def.ghi" },
    });
    expect(getBearerJwt(req)).toBe("abc.def.ghi");
  });

  it("returns null when missing", () => {
    const req = new Request("https://example.com");
    expect(getBearerJwt(req)).toBeNull();
  });

  it("is case-insensitive for Bearer prefix", () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: "bearer token123" },
    });
    expect(getBearerJwt(req)).toBe("token123");
  });
});
