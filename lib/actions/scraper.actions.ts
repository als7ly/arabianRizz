"use server";

import { validateUrl } from "@/lib/security/url-validator";

export async function fetchProductMetadata(url: string) {
  try {
    // Validate URL to prevent SSRF
    await validateUrl(url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WingmanBot/1.0; +https://arabianrizz.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    const getMetaContent = (prop: string) => {
        // Regex to match <meta property="..." content="..."> or <meta name="..." content="...">
        // Handles single/double quotes and extra spaces
        const regex = new RegExp(
            `<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`,
            "i"
        );
        const match = html.match(regex);
        return match ? match[1] : null;
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
