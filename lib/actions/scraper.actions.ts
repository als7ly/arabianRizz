"use server";

import { validateUrl } from "@/lib/security/url-validator";
import { auth } from "@clerk/nextjs";

export async function fetchProductMetadata(url: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate initial URL to prevent SSRF
    await validateUrl(url);

    let currentUrl = url;
    let response;
    let redirectCount = 0;
    const maxRedirects = 5;

    while (redirectCount < maxRedirects) {
        response = await fetch(currentUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; WingmanBot/1.0; +https://arabianrizz.com)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
            redirect: 'manual' // Handle redirects manually for security
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
                redirectCount++;
                const nextUrl = new URL(location, currentUrl).toString();

                // Validate the NEW URL before following
                await validateUrl(nextUrl);

                currentUrl = nextUrl;
                continue;
            }
        }

        break;
    }

    if (redirectCount >= maxRedirects) {
        throw new Error("Too many redirects");
    }

    if (!response || !response.ok) {
        throw new Error(`Failed to fetch URL: ${response?.status} ${response?.statusText}`);
    }

    const html = await response.text();

    const metaMap = new Map<string, string>();
    // Regex to match <meta property="..." content="..."> or <meta name="..." content="...">
    // Handles single/double quotes and extra spaces.
    // Optimization: Parse all meta tags once instead of re-compiling regex for each property.
    const metaRegex = /<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
        const key = match[1].toLowerCase();
        // Keep the first occurrence to match original behavior (html.match finds first)
        if (!metaMap.has(key)) {
            metaMap.set(key, match[2]);
        }
    }

    const getMetaContent = (prop: string) => {
        return metaMap.get(prop.toLowerCase()) || null;
    };

    // 1. Title
    let title = getMetaContent("og:title") ||
                getMetaContent("twitter:title");

    if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1] : "";
    }

    // 2. Description
    const description = getMetaContent("og:description") ||
                        getMetaContent("twitter:description") ||
                        getMetaContent("description") || "";

    // 3. Image
    const image = getMetaContent("og:image") ||
                  getMetaContent("twitter:image");

    // 4. Price (OpenGraph Product)
    const priceAmount = getMetaContent("product:price:amount") ||
                        getMetaContent("price:amount");

    const priceCurrency = getMetaContent("product:price:currency") ||
                          getMetaContent("price:currency") || "USD";

    return {
        title: title ? title.trim() : "",
        description: description ? description.trim() : "",
        image: image || "",
        price: priceAmount ? parseFloat(priceAmount) : undefined,
        currency: priceCurrency
    };

  } catch (error) {
    console.error("Scraper Error:", error);
    // Return partial or empty data on failure, rather than crashing
    return {
        title: "",
        description: "",
        image: "",
        currency: "USD"
    };
  }
}
