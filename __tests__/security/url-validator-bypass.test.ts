/**
 * @jest-environment node
 */
import { validateUrl } from "../../lib/security/url-validator";

describe("URL Validator Bypass", () => {
  // Octal IP for 127.0.0.1
  it("should reject octal IP 0177.0.0.1", async () => {
    await expect(validateUrl("http://0177.0.0.1")).rejects.toThrow();
  });

  // Hex IP for 127.0.0.1
  it("should reject hex IP 0x7f.0.0.1", async () => {
     await expect(validateUrl("http://0x7f.0.0.1")).rejects.toThrow();
  });

  // Integer IP for 127.0.0.1 (2130706433)
  it("should reject integer IP 2130706433", async () => {
      await expect(validateUrl("http://2130706433")).rejects.toThrow();
  });
});
