/**
 * Convex functions for managing interviews
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { interviewStatusValidator } from "./schema";
import { api } from "./_generated/api";
import { evaluateSubjectiveAnswer, generateFollowUpQuestion } from "./lib/openai";

/**
 * Start a new interview session
 */
export const startInterview = mutation({
  args: {
    agentId: v.id("interviewAgents"),
    candidateName: v.string(),
    candidateEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || !agent.isPublished) {
      throw new Error("Agent not found or not published");
    }

    // Get questions to calculate max score
    const questions = await ctx.db
      .query("questions")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);

    const interviewId = await ctx.db.insert("interviews", {
      agentId: args.agentId,
      candidateName: args.candidateName,
      candidateEmail: args.candidateEmail,
      status: "in_progress",
      totalScore: 0,
      maxScore,
      startedAt: Date.now(),
    });

    return {
      interviewId,
      agentName: agent.name,
      questions: questions.map((q) => ({
        _id: q._id,
        type: q.type,
        questionText: q.questionText,
        order: q.order,
        marks: q.marks,
        options: q.options,
      })),
    };
  },
});

/**
 * Submit an answer to a question
 */
export const submitAnswer = action({
  args: {
    interviewId: v.id("interviews"),
    questionId: v.id("questions"),
    candidateAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.runQuery(api.questions.getQuestion, {
      questionId: args.questionId,
    });

    if (!question) {
      throw new Error("Question not found");
    }

    let score = 0;
    let isCorrect = false;
    let evaluationFeedback = "";

    // Evaluate MCQ
    if (question.type === "mcq") {
      const selectedOption = parseInt(args.candidateAnswer);
      isCorrect = selectedOption === question.correctOption;
      score = isCorrect ? question.marks : 0;
      evaluationFeedback = isCorrect ? "Correct!" : "Incorrect";
    }
    
    // Evaluate Subjective
    if (question.type === "subjective" && question.keyPoints) {
      const evaluation = await evaluateSubjectiveAnswer(
        question.questionText,
        question.keyPoints,
        args.candidateAnswer,
        question.marks
      );
      score = evaluation.score;
      evaluationFeedback = evaluation.feedback;
    }

    // Store response
    const responseId = await ctx.runMutation(api.interviews.createResponse, {
      interviewId: args.interviewId,
      questionId: args.questionId,
      candidateAnswer: args.candidateAnswer,
      isCorrect: question.type === "mcq" ? isCorrect : undefined,
      score,
      evaluationFeedback,
    });

    // Update interview total score
    await ctx.runMutation(api.interviews.updateScore, {
      interviewId: args.interviewId,
      scoreToAdd: score,
    });

    return {
      score,
      evaluationFeedback,
      isCorrect: question.type === "mcq" ? isCorrect : undefined,
    };
  },
});

/**
 * Generate follow-up question
 */
export const generateFollowUp = action({
  args: {
    questionId: v.id("questions"),
    candidateAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.runQuery(api.questions.getQuestion, {
      questionId: args.questionId,
    });

    if (!question || question.type !== "subjective") {
      throw new Error("Invalid question for follow-up");
    }

    const followUp = await generateFollowUpQuestion(
      question.questionText,
      args.candidateAnswer,
      question.questionText
    );

    return followUp;
  },
});

/**
 * Complete an interview
 */
export const completeInterview = mutation({
  args: {
    interviewId: v.id("interviews"),
    recordingUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interviewId, {
      status: "completed",
      completedAt: Date.now(),
      recordingUrl: args.recordingUrl,
    });

    const interview = await ctx.db.get(args.interviewId);
    return interview;
  },
});

/**
 * Create an interview response (internal)
 */
export const createResponse = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionId: v.id("questions"),
    candidateAnswer: v.string(),
    isCorrect: v.optional(v.boolean()),
    score: v.number(),
    evaluationFeedback: v.optional(v.string()),
    followUpQuestions: v.optional(v.array(v.string())),
    followUpAnswers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const responseId = await ctx.db.insert("interviewResponses", {
      ...args,
      answeredAt: Date.now(),
    });

    return responseId;
  },
});

/**
 * Update interview total score
 */
export const updateScore = mutation({
  args: {
    interviewId: v.id("interviews"),
    scoreToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) {
      throw new Error("Interview not found");
    }

    await ctx.db.patch(args.interviewId, {
      totalScore: interview.totalScore + args.scoreToAdd,
    });
  },
});

/**
 * Get interview details
 */
export const getInterview = query({
  args: {
    interviewId: v.id("interviews"),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) {
      return null;
    }

    const agent = await ctx.db.get(interview.agentId);
    const responses = await ctx.db
      .query("interviewResponses")
      .withIndex("interviewId", (q) => q.eq("interviewId", args.interviewId))
      .collect();

    return {
      ...interview,
      agent,
      responses,
    };
  },
});

/**
 * Get all interviews for an agent
 */
export const getInterviewsByAgent = query({
  args: {
    agentId: v.id("interviewAgents"),
  },
  handler: async (ctx, args) => {
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("agentId", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return interviews;
  },
});

/**
 * Get interview responses with questions
 */
export const getInterviewResponses = query({
  args: {
    interviewId: v.id("interviews"),
  },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("interviewResponses")
      .withIndex("interviewId", (q) => q.eq("interviewId", args.interviewId))
      .collect();

    const responsesWithQuestions = await Promise.all(
      responses.map(async (response) => {
        const question = await ctx.db.get(response.questionId);
        return {
          ...response,
          question,
        };
      })
    );

    return responsesWithQuestions;
  },
});

