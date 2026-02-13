import { lookup } from 'dns/promises';
import { isIP } from 'net';

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

  // Block localhost string explicitly
  if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]" || hostname === "[::]") {
    throw new Error("Access to localhost is denied");
  }

  // Check if hostname is an IPv4 address (Legacy Check - Keep for fast fail)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      if (parts[0] === 0) throw new Error("Access to private IP range (0.0.0.0/8) is denied");
      if (parts[0] === 10) throw new Error("Access to private IP range (10.0.0.0/8) is denied");
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) throw new Error("Access to private IP range (172.16.0.0/12) is denied");
      if (parts[0] === 192 && parts[1] === 168) throw new Error("Access to private IP range (192.168.0.0/16) is denied");
      if (parts[0] === 127) throw new Error("Access to loopback address is denied");
      if (parts[0] === 169 && parts[1] === 254) throw new Error("Access to link-local address is denied");
  }

  // DNS Resolution Check to prevent DNS Rebinding and bypasses
  try {
    const { address } = await lookup(hostname);
    if (isPrivateIP(address)) {
        throw new Error(`Access to private IP ${address} is denied`);
    }
  } catch (error: any) {
      if (error.message.includes("Access to private IP")) throw error;
      // If DNS lookup fails, fail secure
      throw new Error(`DNS lookup failed for ${hostname}: ${error.message}`);
  }
}

function isPrivateIP(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) {
      const parts = ip.split('.').map(Number);
      if (parts[0] === 0) return true;
      if (parts[0] === 10) return true;
      if (parts[0] === 127) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      return false;
  } else if (family === 6) {
      const normalized = ip.toLowerCase();
      if (normalized === '::1') return true;
      if (normalized === '::') return true;
      if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
      if (normalized.startsWith('fe80:')) return true;
      // IPv4 Mapped IPv6 (::ffff:127.0.0.1)
      if (normalized.startsWith('::ffff:')) {
          const ipv4Part = ip.substring(7);
          return isPrivateIP(ipv4Part); // Recursive check for IPv4 part
      }
      return false;
  }
  return false;
}
