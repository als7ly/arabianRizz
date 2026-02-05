import { validateUrl } from "../../lib/security/url-validator";

describe("URL Validator", () => {
  // Valid URLs
  it("should allow valid public HTTP URLs", () => {
    expect(() => validateUrl("http://google.com")).not.toThrow();
  });

  it("should allow valid public HTTPS URLs", () => {
    expect(() => validateUrl("https://example.com/path?query=1")).not.toThrow();
  });

  // Invalid Protocols
  it("should reject invalid protocols", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow("Invalid protocol");
    expect(() => validateUrl("file:///etc/passwd")).toThrow("Invalid protocol");
  });

  // Localhost
  it("should reject localhost", () => {
    expect(() => validateUrl("http://localhost")).toThrow("Access to localhost is denied");
    expect(() => validateUrl("http://localhost:3000")).toThrow("Access to localhost is denied");
  });

  it("should reject IPv6 localhost", () => {
      expect(() => validateUrl("http://[::1]")).toThrow("Access to localhost is denied");
  });

  it("should reject IPv6 unspecified", () => {
      expect(() => validateUrl("http://[::]")).toThrow("Access to localhost is denied");
  });

  // Private IPv4
  it("should reject 0.0.0.0 (Current Network)", () => {
    expect(() => validateUrl("http://0.0.0.0")).toThrow("Access to private IP range (0.0.0.0/8) is denied");
  });

  it("should reject 127.0.0.1 (Loopback)", () => {
    expect(() => validateUrl("http://127.0.0.1")).toThrow("Access to loopback address is denied");
  });

  it("should reject 10.x.x.x (Private)", () => {
    expect(() => validateUrl("http://10.0.0.5")).toThrow("Access to private IP range (10.0.0.0/8) is denied");
  });

  it("should reject 192.168.x.x (Private)", () => {
    expect(() => validateUrl("http://192.168.1.1")).toThrow("Access to private IP range (192.168.0.0/16) is denied");
  });

  it("should reject 172.16.x.x (Private)", () => {
    expect(() => validateUrl("http://172.16.0.1")).toThrow("Access to private IP range (172.16.0.0/12) is denied");
  });

  it("should reject 172.31.x.x (Private)", () => {
    expect(() => validateUrl("http://172.31.255.255")).toThrow("Access to private IP range (172.16.0.0/12) is denied");
  });

  it("should reject 169.254.x.x (Link-local)", () => {
      expect(() => validateUrl("http://169.254.169.254")).toThrow("Access to link-local address is denied");
  });

  // Boundary checks for 172.x
  it("should allow 172.15.x.x (Public)", () => {
    expect(() => validateUrl("http://172.15.0.1")).not.toThrow();
  });

  it("should allow 172.32.x.x (Public)", () => {
    expect(() => validateUrl("http://172.32.0.1")).not.toThrow();
  });
});
