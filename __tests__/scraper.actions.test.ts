/** @jest-environment node */
import { fetchProductMetadata } from "@/lib/actions/scraper.actions";
import { auth } from "@clerk/nextjs";
import { validateUrl } from "@/lib/security/url-validator";

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

// Mock url-validator
jest.mock("@/lib/security/url-validator", () => ({
  validateUrl: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe("fetchProductMetadata Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw Unauthorized if user is not logged in", async () => {
    // Arrange
    (auth as jest.Mock).mockReturnValue({ userId: null });
    (validateUrl as jest.Mock).mockResolvedValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html><title>Test</title></html>")
    });

    // Act & Assert
    // This expects the function to throw "Unauthorized" which it currently does NOT.
    // So this test should fail initially.
    await expect(fetchProductMetadata("https://example.com")).rejects.toThrow("Unauthorized");
  });

  it("should allow request if user is logged in", async () => {
    // Arrange
    (auth as jest.Mock).mockReturnValue({ userId: "user_123" });
    (validateUrl as jest.Mock).mockResolvedValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html><title>Test</title></html>"),
        headers: { get: () => null }
    });

    // Act
    const result = await fetchProductMetadata("https://example.com");

    // Assert
    expect(result).toHaveProperty("title", "Test");
    expect(auth).toHaveBeenCalled();
  });
});
