/**
 * Convex functions for managing questions
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { questionTypeValidator } from "./schema";
import { api } from "./_generated/api";
import {
  generateMCQs,
  generateSubjectiveQuestions,
  generateQuestionsFromTopic,
} from "./lib/openai";

/**
 * Generate questions from knowledge sources
 */
export const generateQuestions = action({
  args: {
    agentId: v.id("interviewAgents"),
    mcqCount: v.number(),
    subjectiveCount: v.number(),
    marksPerMCQ: v.number(),
    marksPerSubjective: v.number(),
  },
  handler: async (ctx, args) => {
    // Get combined content from all knowledge sources
    const combinedContent = await ctx.runQuery(
      api.knowledgeSources.getCombinedContent,
      {
        agentId: args.agentId,
      }
    );

    if (!combinedContent) {
      throw new Error("No knowledge sources found");
    }

    // Get knowledge sources to determine if it's topic-based
    const sources = await ctx.runQuery(
      api.knowledgeSources.getSourcesByAgent,
      {
        agentId: args.agentId,
      }
    );

    let mcqs: any[] = [];
    let subjectiveQuestions: any[] = [];

    // If only topic-based sources, use topic generation
    const isTopicOnly = sources.every((s: any) => s.type === "topic");

    if (isTopicOnly && sources.length === 1) {
      const topic = sources[0].content;
      const generated = await generateQuestionsFromTopic(
        topic,
        args.mcqCount,
        args.subjectiveCount,
        args.marksPerMCQ,
        args.marksPerSubjective
      );
      mcqs = generated.mcqs;
      subjectiveQuestions = generated.subjective;
    } else {
      // Generate from combined content
      if (args.mcqCount > 0) {
        mcqs = await generateMCQs(
          combinedContent,
          args.mcqCount,
          args.marksPerMCQ
        );
      }

      if (args.subjectiveCount > 0) {
        subjectiveQuestions = await generateSubjectiveQuestions(
          combinedContent,
          args.subjectiveCount,
          args.marksPerSubjective
        );
      }
    }

    // Insert questions into database
    const questionIds: string[] = [];
    let order = 1;

    for (const mcq of mcqs) {
      const id = await ctx.runMutation(api.questions.createQuestion, {
        agentId: args.agentId,
        type: "mcq",
        questionText: mcq.questionText,
        order: order++,
        marks: mcq.marks,
        options: mcq.options,
        correctOption: mcq.correctOption,
      });
      questionIds.push(id);
    }

    for (const subjective of subjectiveQuestions) {
      const id = await ctx.runMutation(api.questions.createQuestion, {
        agentId: args.agentId,
        type: "subjective",
        questionText: subjective.questionText,
        order: order++,
        marks: subjective.marks,
        keyPoints: subjective.keyPoints,
      });
      questionIds.push(id);
    }

    // Update agent's total marks
    const totalMarks =
      args.mcqCount * args.marksPerMCQ +
      args.subjectiveCount * args.marksPerSubjective;

    await ctx.runMutation(api.agents.updateAgent, {
      agentId: args.agentId,
      totalMarks,
    });

    return {
      questionIds,
      totalMarks,
    };
  },
});

/**
 * Create a single question
 */
export const createQuestion = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    type: questionTypeValidator,
    questionText: v.string(),
    order: v.number(),
    marks: v.number(),
    options: v.optional(v.array(v.string())),
    correctOption: v.optional(v.number()),
    keyPoints: v.optional(v.array(v.string())),
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

    // Validate MCQ has options and correct option
    if (args.type === "mcq") {
      if (!args.options || args.options.length !== 4) {
        throw new Error("MCQ must have exactly 4 options");
      }
      if (
        args.correctOption === undefined ||
        args.correctOption < 0 ||
        args.correctOption > 3
      ) {
        throw new Error("MCQ must have a valid correct option (0-3)");
      }
    }

    // Validate subjective has key points
    if (args.type === "subjective") {
      if (!args.keyPoints || args.keyPoints.length < 3) {
        throw new Error("Subjective question must have at least 3 key points");
      }
    }

    const questionId = await ctx.db.insert("questions", {
      agentId: args.agentId,
      type: args.type,
      questionText: args.questionText,
      order: args.order,
      marks: args.marks,
      options: args.options,
      correctOption: args.correctOption,
      keyPoints: args.keyPoints,
      createdAt: Date.now(),
    });

    return questionId;
  },
});

/**
 * Update a question
 */
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    questionText: v.optional(v.string()),
    marks: v.optional(v.number()),
    order: v.optional(v.number()),
    options: v.optional(v.array(v.string())),
    correctOption: v.optional(v.number()),
    keyPoints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const agent = await ctx.db.get(question.agentId);
    if (!agent || agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    const { questionId, ...updates } = args;

    await ctx.db.patch(questionId, updates);

    return questionId;
  },
});

/**
 * Delete a question
 */
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const agent = await ctx.db.get(question.agentId);
    if (!agent || agent.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.questionId);

    // Recalculate total marks
    const remainingQuestions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", question.agentId))
      .collect();

    const totalMarks = remainingQuestions.reduce((sum, q) => sum + q.marks, 0);

    await ctx.db.patch(question.agentId, {
      totalMarks,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reorder questions
 */
export const reorderQuestions = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    questionIds: v.array(v.id("questions")),
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

    // Update order for each question
    await Promise.all(
      args.questionIds.map(async (questionId, index) => {
        await ctx.db.patch(questionId, {
          order: index + 1,
        });
      })
    );

    return { success: true };
  },
});

/**
 * Get all questions for an agent
 */
export const getQuestionsByAgent = query({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .order("asc")
      .collect();

    return questions;
  },
});

/**
 * Get a single question
 */
export const getQuestion = query({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

/**
 * Delete all questions for an agent
 */
export const deleteAllQuestions = mutation({
  args: {
    agentId: v.id("interviewAgents"),
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

    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    await ctx.db.patch(args.agentId, {
      totalMarks: 0,
      updatedAt: Date.now(),
    });

    return { success: true, deletedCount: questions.length };
  },
});

