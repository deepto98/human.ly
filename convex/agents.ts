/**
 * Convex functions for managing interview agents
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import {
  agentGenderValidator,
  conversationalStyleValidator,
} from "./schema";

/**
 * Create a new interview agent (draft)
 */
export const createAgent = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const shareableLink = generateShareableLink();

    const agentId = await ctx.db.insert("interviewAgents", {
      creatorId: userId,
      name: "Untitled Interview",
      gender: "female",
      appearance: "default_avatar",
      voiceType: "default",
      conversationalStyle: "formal",
      enableFollowUps: true,
      maxFollowUps: 2,
      shareableLink,
      isPublished: false,
      totalMarks: 0,
      createdAt: now,
      updatedAt: now,
    });

    return agentId;
  },
});

/**
 * Update agent configuration
 */
export const updateAgent = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    name: v.optional(v.string()),
    gender: v.optional(agentGenderValidator),
    appearance: v.optional(v.string()),
    voiceType: v.optional(v.string()),
    conversationalStyle: v.optional(conversationalStyleValidator),
    enableFollowUps: v.optional(v.boolean()),
    maxFollowUps: v.optional(v.number()),
    totalMarks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    const { agentId, ...updates } = args;

    await ctx.db.patch(agentId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return agentId;
  },
});

/**
 * Publish an agent (makes it accessible via shareable link)
 */
export const publishAgent = mutation({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    // Verify agent has questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    if (questions.length === 0) {
      throw new Error("Cannot publish agent without questions");
    }

    await ctx.db.patch(args.agentId, {
      isPublished: true,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      shareableLink: agent.shareableLink,
    };
  },
});

/**
 * Unpublish an agent
 */
export const unpublishAgent = mutation({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.agentId, {
      isPublished: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an agent and all its associated data
 */
export const deleteAgent = mutation({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete knowledge sources
    const knowledgeSources = await ctx.db
      .query("knowledgeSources")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
    for (const source of knowledgeSources) {
      await ctx.db.delete(source._id);
    }

    // Delete questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Note: We keep interviews and responses for historical records
    // but mark them as orphaned

    // Delete agent
    await ctx.db.delete(args.agentId);

    return { success: true };
  },
});

/**
 * Get all agents for the current user
 */
export const getMyAgents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const agents = await ctx.db
      .query("interviewAgents")
      .withIndex("creatorId", (q) => q.eq("creatorId", userId))
      .collect();

    // Get interview count for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const interviews = await ctx.db
          .query("interviews")
          .withIndex("agentId", (q) => q.eq("agentId", agent._id))
          .collect();

        return {
          ...agent,
          interviewCount: interviews.length,
          completedCount: interviews.filter((i) => i.status === "completed")
            .length,
        };
      })
    );

    return agentsWithStats;
  },
});

/**
 * Get a single agent by ID
 */
export const getAgent = query({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return null;
    }

    // Get questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .order("asc")
      .collect();

    // Get knowledge sources
    const knowledgeSources = await ctx.db
      .query("knowledgeSources")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    return {
      ...agent,
      questions,
      knowledgeSources,
    };
  },
});

/**
 * Get agent by shareable link (public)
 */
export const getAgentByLink = query({
  args: {
    shareableLink: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("interviewAgents")
      .withIndex("shareableLink", (q) =>
        q.eq("shareableLink", args.shareableLink)
      )
      .first();

    if (!agent || !agent.isPublished) {
      return null;
    }

    // Get questions (without answers for security)
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", agent._id))
      .order("asc")
      .collect();

    // Remove sensitive data
    const sanitizedQuestions = questions.map((q) => ({
      _id: q._id,
      type: q.type,
      questionText: q.questionText,
      order: q.order,
      marks: q.marks,
      options: q.options, // Include options for MCQ
      // Don't include correctOption or keyPoints
    }));

    return {
      _id: agent._id,
      name: agent.name,
      gender: agent.gender,
      appearance: agent.appearance,
      voiceType: agent.voiceType,
      conversationalStyle: agent.conversationalStyle,
      totalMarks: agent.totalMarks,
      questions: sanitizedQuestions,
    };
  },
});

/**
 * Generate a unique shareable link
 */
function generateShareableLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

