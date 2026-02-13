import dns from "node:dns/promises";
import net from "node:net";

export async function validateUrl(url: string): Promise<void> {
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

  // Block localhost string literals
  if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]" || hostname === "[::]") {
    throw new Error("Access to localhost is denied");
  }

  let address: string;
  try {
    // dns.lookup uses the OS resolver (like ping/fetch)
    const result = await dns.lookup(hostname);
    address = result.address;
  } catch (error) {
     if (net.isIP(hostname)) {
         address = hostname;
     } else {
         throw new Error(`Could not resolve hostname: ${hostname}`);
     }
  }

  // Normalize IPv6 mapped IPv4 (::ffff:127.0.0.1)
  if (net.isIPv6(address) && address.toLowerCase().startsWith("::ffff:")) {
      address = address.substring(7);
  }

  if (net.isIPv4(address)) {
      const parts = address.split('.').map(Number);

      // 0.0.0.0/8
      if (parts[0] === 0) throw new Error("Access to private IP range (0.0.0.0/8) is denied");
      // 10.0.0.0/8
      if (parts[0] === 10) throw new Error("Access to private IP range (10.0.0.0/8) is denied");
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) throw new Error("Access to private IP range (172.16.0.0/12) is denied");
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) throw new Error("Access to private IP range (192.168.0.0/16) is denied");
      // 127.0.0.0/8
      if (parts[0] === 127) throw new Error("Access to loopback address is denied");
      // 169.254.0.0/16
      if (parts[0] === 169 && parts[1] === 254) throw new Error("Access to link-local address is denied");

  } else if (net.isIPv6(address)) {
      // ::1
      if (address === "::1") throw new Error("Access to loopback address is denied");
      // fc00::/7 (Unique Local)
      if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) {
          throw new Error("Access to unique local address is denied");
      }
      // fe80::/10 (Link Local)
      if (address.toLowerCase().startsWith("fe80")) {
          throw new Error("Access to link-local address is denied");
      }
      return false;
  }
  return false;
}
