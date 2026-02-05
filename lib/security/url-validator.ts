export function validateUrl(url: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error("Invalid URL format");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Invalid protocol: only http and https are allowed");
  }

  const hostname = parsedUrl.hostname;

  // Block localhost
  if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]" || hostname === "[::]") {
    throw new Error("Access to localhost is denied");
  }

  // Check if hostname is an IPv4 address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.').map(Number);

      // 0.0.0.0/8 (Current network)
      if (parts[0] === 0) {
          throw new Error("Access to private IP range (0.0.0.0/8) is denied");
      }

      // 10.0.0.0/8
      if (parts[0] === 10) {
          throw new Error("Access to private IP range (10.0.0.0/8) is denied");
      }

      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
          throw new Error("Access to private IP range (172.16.0.0/12) is denied");
      }

      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) {
          throw new Error("Access to private IP range (192.168.0.0/16) is denied");
      }

      // 127.0.0.0/8
      if (parts[0] === 127) {
          throw new Error("Access to loopback address is denied");
      }

      // 169.254.0.0/16
      if (parts[0] === 169 && parts[1] === 254) {
          throw new Error("Access to link-local address is denied");
      }
  }
}
