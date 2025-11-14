/**
 * Firecrawl Integration
 * Handles web scraping, search, and content extraction
 */

import Firecrawl from "firecrawl";
import { FIRECRAWL_API_KEY } from "../env";

// Initialize Firecrawl client
function getFirecrawlClient() {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }
  return new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
}

/**
 * Scrape a single URL and extract its content
 */
export async function scrapeUrl(url: string): Promise<{
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}> {
  try {
    const firecrawl = getFirecrawlClient();
    
    const result = await firecrawl.scrape(url, {
      formats: ["markdown", "html"],
    });

    return {
      content: result.markdown || result.html || "",
      title: result.metadata?.title || "",
      metadata: result.metadata || {},
    };
  } catch (error) {
    console.error("Error scraping URL:", url, error);
    throw new Error(`Failed to scrape URL: ${url}`);
  }
}

/**
 * Scrape multiple URLs in parallel
 */
export async function scrapeUrls(urls: string[]): Promise<
  Array<{
    url: string;
    content: string;
    title?: string;
    metadata?: Record<string, any>;
    error?: string;
  }>
> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const scraped = await scrapeUrl(url);
        return { url, ...scraped };
      } catch (error) {
        return {
          url,
          content: "",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        url: urls[index],
        content: "",
        error: result.reason?.message || "Failed to scrape",
      };
    }
  });
}

/**
 * Search the web using Firecrawl and return results with URLs
 */
export async function searchWeb(query: string, maxResults: number = 10): Promise<
  Array<{
    url: string;
    title: string;
    description: string;
    content?: string;
  }>
> {
  try {
    const firecrawl = getFirecrawlClient();
    
    const searchResults = await firecrawl.search(query, {
      limit: maxResults,
    });

    // searchResults is a SearchData object with a data array
    const results = Array.isArray(searchResults) ? searchResults : (searchResults as any).data || [];

    return results.map((result: any) => ({
      url: result.url,
      title: result.title || "",
      description: result.description || "",
      content: result.content || "",
    }));
  } catch (error) {
    console.error("Error searching web:", query, error);
    throw new Error(`Failed to search: ${query}`);
  }
}

/**
 * Scrape content from a document URL (for uploaded PDFs/DOCX in R2)
 * Note: This assumes the document is accessible via HTTP
 */
export async function scrapeDocument(documentUrl: string): Promise<{
  content: string;
  metadata?: Record<string, any>;
}> {
  try {
    const firecrawl = getFirecrawlClient();
    
    // Firecrawl can extract text from PDFs and documents via URL
    const result = await firecrawl.scrape(documentUrl, {
      formats: ["markdown"],
    });

    return {
      content: result.markdown || "",
      metadata: result.metadata || {},
    };
  } catch (error) {
    console.error("Error scraping document:", documentUrl, error);
    throw new Error(`Failed to scrape document: ${documentUrl}`);
  }
}

/**
 * Extract main content from scraped data, removing boilerplate
 */
export function extractMainContent(scrapedContent: string): string {
  // Remove common navigation, footer, header patterns
  let content = scrapedContent;
  
  // Remove markdown image syntax
  content = content.replace(/!\[.*?\]\(.*?\)/g, "");
  
  // Remove multiple consecutive newlines
  content = content.replace(/\n{3,}/g, "\n\n");
  
  // Trim whitespace
  content = content.trim();
  
  return content;
}

/**
 * Check if a URL is valid and accessible
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generate a preview/thumbnail for a URL (returns metadata)
 */
export async function getUrlPreview(url: string): Promise<{
  url: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
}> {
  try {
    const scraped = await scrapeUrl(url);
    return {
      url,
      title: scraped.metadata?.title || url,
      description: scraped.metadata?.description || "",
      image: scraped.metadata?.ogImage || scraped.metadata?.image,
      favicon: scraped.metadata?.favicon,
    };
  } catch (error) {
    console.error("Error getting URL preview:", url, error);
    return {
      url,
      title: url,
      description: "Failed to load preview",
    };
  }
}

