/**
 * Convex functions for file storage operations
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { uploadDocument } from "./lib/r2";
import { scrapeDocument, extractMainContent } from "./lib/firecrawl";

/**
 * Upload document to R2 and scrape its content with Firecrawl
 * Returns the scraped content that can be used for question generation
 */
export const uploadAndScrapeDocument = action({
  args: {
    filename: v.string(),
    fileData: v.bytes(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(args.fileData);
      
      console.log("Uploading document to R2:", args.filename);
      
      // Upload to R2
      const uploadResult = await uploadDocument(
        args.filename,
        uint8Array,
        args.contentType
      );

      console.log("Document uploaded to R2:", uploadResult.url);
      console.log("Starting Firecrawl scrape of document...");

      // Scrape document content using Firecrawl
      const scraped = await scrapeDocument(uploadResult.url);
      const cleanContent = extractMainContent(scraped.content);

      console.log("Document scraped, content length:", cleanContent.length);

      return {
        success: true,
        scrapedContent: cleanContent,
        r2Url: uploadResult.url,
        r2Key: uploadResult.key,
        filename: args.filename,
        fileSize: uploadResult.fileSize,
      };
    } catch (error) {
      console.error("Error uploading/scraping document:", error);
      throw new Error(`Failed to process document: ${args.filename}`);
    }
  },
});
