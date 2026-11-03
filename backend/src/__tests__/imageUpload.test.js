import { describe, expect, it } from "@jest/globals";
import {
  buildPublicImageUrl,
  imageKeyFromManagedUrl,
  isManagedImageUrl,
  readStorageConfig,
} from "../config/storage.js";
import { detectImageType } from "../middlewares/imageUpload.js";

describe("image storage boundaries", () => {
  it("keeps storage disabled when Cloudinary credentials are incomplete", () => {
    expect(
      readStorageConfig({ CLOUDINARY_CLOUD_NAME: "vambora" }).enabled,
    ).toBe(false);
  });

  it("accepts only generated URLs from managed prefixes", () => {
    const url =
      "https://media.example.com/profiles/123e4567-e89b-12d3-a456-426614174000.webp";
    expect(isManagedImageUrl(url, "https://media.example.com")).toBe(true);
    expect(imageKeyFromManagedUrl(url, "https://media.example.com")).toBe(
      "profiles/123e4567-e89b-12d3-a456-426614174000.webp",
    );
    expect(
      isManagedImageUrl(
        "https://images.example.com/profiles/abc.webp",
        "https://media.example.com",
      ),
    ).toBe(false);
    expect(
      imageKeyFromManagedUrl(
        "https://images.example.com/routes/abc.webp",
        "https://media.example.com",
      ),
    ).toBeNull();
    expect(
      isManagedImageUrl(
        "https://media.example.com/community/../profiles/abc.webp",
        "https://media.example.com",
      ),
    ).toBe(false);
  });

  it("rejects a public URL longer than the existing database field", () => {
    expect(() =>
      buildPublicImageUrl(
        `profiles/${"a".repeat(240)}.webp`,
        "https://m.example.com",
      ),
    ).toThrow("255");
  });

  it("detects image bytes instead of trusting only the MIME type", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "image/jpeg",
    );
    expect(detectImageType(Buffer.from("not an image"))).toBeNull();
  });
});
