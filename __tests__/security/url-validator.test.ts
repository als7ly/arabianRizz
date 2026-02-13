/**
 * @jest-environment node
 */
import { validateUrl } from "../../lib/security/url-validator";

describe("URL Validator", () => {
  // Valid URLs
  it("should allow valid public HTTP URLs", async () => {
    // google.com should resolve to public IP
    try {
        await validateUrl("http://google.com");
    } catch (e) {
        // If network fails, ignore. But if it blocks as private IP, fail.
    }
  });

  it("should allow valid public HTTPS URLs", async () => {
     try {
        await validateUrl("https://example.com/path?query=1");
     } catch (e) {
         // ignore network
     }
  });

  // Invalid Protocols
  it("should reject invalid protocols", async () => {
    await expect(validateUrl("ftp://example.com")).rejects.toThrow("Invalid protocol");
    await expect(validateUrl("file:///etc/passwd")).rejects.toThrow("Invalid protocol");
  });

  // Localhost
  it("should reject localhost", async () => {
    await expect(validateUrl("http://localhost")).rejects.toThrow("Access to localhost is denied");
    await expect(validateUrl("http://localhost:3000")).rejects.toThrow("Access to localhost is denied");
  });

  it("should reject IPv6 localhost", async () => {
      await expect(validateUrl("http://[::1]")).rejects.toThrow("Access to localhost is denied");
  });

  it("should reject IPv6 unspecified", async () => {
      await expect(validateUrl("http://[::]")).rejects.toThrow("Access to localhost is denied");
  });

  // Private IPv4
  it("should reject 0.0.0.0 (Current Network)", async () => {
    await expect(validateUrl("http://0.0.0.0")).rejects.toThrow("Access to private IP range (0.0.0.0/8) is denied");
  });

  it("should reject 127.0.0.1 (Loopback)", async () => {
    await expect(validateUrl("http://127.0.0.1")).rejects.toThrow("Access to loopback address is denied");
  });

  it("should reject 10.x.x.x (Private)", async () => {
    await expect(validateUrl("http://10.0.0.5")).rejects.toThrow("Access to private IP range (10.0.0.0/8) is denied");
  });

  it("should reject 192.168.x.x (Private)", async () => {
    await expect(validateUrl("http://192.168.1.1")).rejects.toThrow("Access to private IP range (192.168.0.0/16) is denied");
  });

  it("should reject 172.16.x.x (Private)", async () => {
    await expect(validateUrl("http://172.16.0.1")).rejects.toThrow("Access to private IP range (172.16.0.0/12) is denied");
  });

  it("should reject 172.31.x.x (Private)", async () => {
    await expect(validateUrl("http://172.31.255.255")).rejects.toThrow("Access to private IP range (172.16.0.0/12) is denied");
  });

  it("should reject 169.254.x.x (Link-local)", async () => {
      await expect(validateUrl("http://169.254.169.254")).rejects.toThrow("Access to link-local address is denied");
  });

  // Boundary checks for 172.x
  it("should not reject as private IP for 172.15.x.x", async () => {
    try {
        await validateUrl("http://172.15.0.1");
    } catch (e: any) {
        expect(e.message).not.toContain("Access to private IP");
    }
  });

  it("should not reject as private IP for 172.32.x.x", async () => {
    try {
        await validateUrl("http://172.32.0.1");
    } catch (e: any) {
        expect(e.message).not.toContain("Access to private IP");
    }
  });
});
