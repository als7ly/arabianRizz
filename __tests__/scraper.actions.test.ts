import { fetchProductMetadata } from '@/lib/actions/scraper.actions';
import { auth } from "@clerk/nextjs";
import { validateUrl } from "@/lib/security/url-validator";

// Mocks
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

// Mock url-validator
jest.mock("@/lib/security/url-validator", () => ({
  validateUrl: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Scraper Actions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should verify authentication is required', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });

    const result = await fetchProductMetadata('http://example.com');

    expect(auth).toHaveBeenCalled();
    // Verify validateUrl was NOT called (meaning we failed before reaching it)
    expect(validateUrl).not.toHaveBeenCalled();
    // Verify error was logged (since the function catches errors)
    expect(consoleErrorSpy).toHaveBeenCalledWith("Scraper Error:", expect.objectContaining({ message: "Unauthorized" }));
    // Verify default empty result is returned
    expect(result).toEqual({
        title: "",
        description: "",
        image: "",
        currency: "USD"
    });
  });

  it('should proceed when authenticated', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });
    (validateUrl as jest.Mock).mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><head><title>Test Title</title></head><body></body></html>'),
        headers: { get: jest.fn() }
    });

    const result = await fetchProductMetadata('http://example.com');

    expect(auth).toHaveBeenCalled();
    expect(validateUrl).toHaveBeenCalledWith('http://example.com');
    expect(result.title).toBe('Test Title');
  });
});
