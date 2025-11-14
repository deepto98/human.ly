/**
 * Convex functions for managing knowledge sources
 */

import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { knowledgeSourceTypeValidator } from "./schema";
import { api, internal } from "./_generated/api";
import {
  scrapeUrl,
  scrapeUrls,
  searchWeb,
  scrapeDocument,
  extractMainContent,
} from "./lib/firecrawl";
import { uploadDocument } from "./lib/r2";

/**
 * Add a topic-based knowledge source
 */
export const addTopicSource = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    const sourceId = await ctx.db.insert("knowledgeSources", {
      agentId: args.agentId,
      type: "topic",
      content: args.topic,
      createdAt: Date.now(),
    });

    return sourceId;
  },
});

/**
 * Add URL-based knowledge source and scrape it
 */
export const addUrlSource = action({
  args: {
    agentId: v.id("interviewAgents"),
    url: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Scrape the URL
    const scraped = await scrapeUrl(args.url);
    const cleanContent = extractMainContent(scraped.content);

    // Store in database
    const sourceId: string = await ctx.runMutation(internal.knowledgeSources.insertUrlSource, {
      agentId: args.agentId,
      url: args.url,
      scrapedContent: cleanContent,
      title: scraped.title,
      metadata: scraped.metadata,
    });

    return sourceId;
  },
});

/**
 * Internal mutation to insert URL source
 */
export const insertUrlSource = internalMutation({
  args: {
    agentId: v.id("interviewAgents"),
    url: v.string(),
    scrapedContent: v.string(),
    title: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<string> => {
    const sourceId: string = await ctx.runMutation(api.knowledgeSources.createSource, {
      agentId: args.agentId,
      type: "url",
      content: args.url,
      scrapedContent: args.scrapedContent,
      metadata: { title: args.title, ...args.metadata },
    });

    return sourceId;
  },
});

/**
 * Create a knowledge source (internal)
 */
export const createSource = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    type: knowledgeSourceTypeValidator,
    content: v.string(),
    scrapedContent: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    const sourceId = await ctx.db.insert("knowledgeSources", {
      ...args,
      createdAt: Date.now(),
    });

    return sourceId;
  },
});

/**
 * Search web and return results for selection
 */
export const searchWebForSources = action({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await searchWeb(args.query, args.maxResults || 10);
    return results;
  },
});

/**
 * Add multiple URLs from web search results
 */
export const addWebSearchSources = action({
  args: {
    agentId: v.id("interviewAgents"),
    urls: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<(string | null)[]> => {
    // Scrape all URLs in parallel
    const scrapedResults = await scrapeUrls(args.urls);

    // Store each successful scrape
    const sourceIds: (string | null)[] = await Promise.all(
      scrapedResults.map(async (result): Promise<string | null> => {
        if (result.error || !result.content) {
          return null;
        }

        const cleanContent = extractMainContent(result.content);

        return await ctx.runMutation(internal.knowledgeSources.insertUrlSource, {
          agentId: args.agentId,
          url: result.url,
          scrapedContent: cleanContent,
          title: result.title,
          metadata: result.metadata,
        });
      })
    );

    return sourceIds.filter((id: string | null) => id !== null);
  },
});

/**
 * Upload document and create knowledge source
 */
export const uploadDocumentSource = action({
  args: {
    agentId: v.id("interviewAgents"),
    filename: v.string(),
    fileData: v.bytes(),
    contentType: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(args.fileData);
    
    // Upload to R2
    const uploadResult = await uploadDocument(
      args.filename,
      uint8Array,
      args.contentType
    );

    // Scrape document content
    const scraped = await scrapeDocument(uploadResult.url);
    const cleanContent = extractMainContent(scraped.content);

    // Store in database
    const sourceId: string = await ctx.runMutation(api.knowledgeSources.createSource, {
      agentId: args.agentId,
      type: "document",
      content: args.filename,
      scrapedContent: cleanContent,
      documentUrl: uploadResult.url,
      metadata: {
        fileSize: uploadResult.fileSize,
        contentType: args.contentType,
        r2Key: uploadResult.key,
      },
    });

    return sourceId;
  },
});

/**
 * Delete a knowledge source
 */
export const deleteSource = mutation({
  args: {
    sourceId: v.id("knowledgeSources"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const source = await ctx.db.get(args.sourceId);
    if (!source) {
      throw new Error("Source not found");
    }

    const agent = await ctx.db.get(source.agentId);
    if (!agent || agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.sourceId);
    return { success: true };
  },
});

/**
 * Get all knowledge sources for an agent
 */
export const getSourcesByAgent = query({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("knowledgeSources")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    return sources;
  },
});

/**
 * Get combined content from all sources for question generation
 */
export const getCombinedContent = query({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("knowledgeSources")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    let combinedContent = "";

    for (const source of sources) {
      if (source.type === "topic") {
        combinedContent += `\n\nTopic: ${source.content}\n`;
      } else if (source.scrapedContent) {
        combinedContent += `\n\n${source.scrapedContent}\n`;
      }
    }

    return combinedContent.trim();
  },
});

