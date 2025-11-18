/**
 * Convex functions for managing interviews
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { evaluateSubjectiveAnswer, generateFollowUpQuestion, getLLM } from "./lib/openai";

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
 * Returns generic response to candidate (doesn't expose correct/incorrect)
 */
export const submitAnswer = action({
  args: {
    interviewId: v.id("interviews"),
    questionId: v.id("questions"),
    candidateAnswer: v.string(),
  },
  handler: async (ctx, args): Promise<{
    acknowledged: boolean;
  }> => {
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
      evaluationFeedback = `Answer evaluated: ${isCorrect ? "Correct" : "Incorrect"}`;
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
      evaluationFeedback = evaluation.feedback; // For admin only
    }

    // Store response (with full evaluation details for admin)
    await ctx.runMutation(api.interviews.createResponse, {
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

    // Return generic acknowledgment (don't expose correct/incorrect to candidate)
    return {
      acknowledged: true,
    };
  },
});

/**
 * Generate interactive follow-up question
 * Asks candidate what they missed or need to clarify
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

    // Get evaluation to see what was missed
    const evaluation = await evaluateSubjectiveAnswer(
      question.questionText,
      question.keyPoints || [],
      args.candidateAnswer,
      question.marks
    );

    // Generate interactive follow-up based on missed points
    const llm = getLLM(0.8);
    const missedPointsText = evaluation.missedPoints && evaluation.missedPoints.length > 0
      ? evaluation.missedPoints.join(", ")
      : "some key aspects";

    const prompt = `You are conducting an interview. The candidate answered a subjective question, but missed some important points. 

Original Question: ${question.questionText}

Candidate's Answer:
"""
${args.candidateAnswer}
"""

Key points that were missed or not fully covered:
${missedPointsText}

Generate ONE interactive, conversational follow-up question that:
- Asks the candidate what they might have missed in their first response
- Encourages them to think about additional aspects they haven't covered
- Is friendly and helpful, not confrontational
- Guides them to cover the missed points without directly stating them
- Feels natural and conversational

Return ONLY the follow-up question, nothing else.`;

    try {
      const response = await llm.invoke(prompt);
      return (response.content as string).trim().replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error("Error generating interactive follow-up:", error);
      return "Is there anything else you'd like to add to your answer? Perhaps some additional aspects we haven't covered yet?";
    }
  },
});

/**
 * Submit candidate introduction
 */
export const submitIntro = mutation({
  args: {
    interviewId: v.id("interviews"),
    candidateIntro: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interviewId, {
      candidateIntro: args.candidateIntro,
    });
    return { success: true };
  },
});

/**
 * Submit follow-up answer for a question
 */
export const submitFollowUpAnswer = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionId: v.id("questions"),
    followUpQuestion: v.string(),
    followUpAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing response
    const existing = await ctx.db
      .query("interviewResponses")
      .withIndex("interviewId_questionId", (q) =>
        q.eq("interviewId", args.interviewId).eq("questionId", args.questionId)
      )
      .first();

    if (existing) {
      // Update with follow-up question and answer
      const currentFollowUps = existing.followUpQuestions || [];
      const currentFollowUpAnswers = existing.followUpAnswers || [];
      
      await ctx.db.patch(existing._id, {
        followUpQuestions: [...currentFollowUps, args.followUpQuestion],
        followUpAnswers: [...currentFollowUpAnswers, args.followUpAnswer],
      });
      return existing._id;
    }

    // If no existing response, create one
    const responseId = await ctx.db.insert("interviewResponses", {
      interviewId: args.interviewId,
      questionId: args.questionId,
      candidateAnswer: "", // Will be set by main answer
      score: 0,
      followUpQuestions: [args.followUpQuestion],
      followUpAnswers: [args.followUpAnswer],
      answeredAt: Date.now(),
    });

    return responseId;
  },
});

/**
 * Upload interview recording to R2
 */
export const uploadRecording = action({
  args: {
    interviewId: v.id("interviews"),
    videoData: v.array(v.number()),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const { uploadRecording } = await import("./lib/r2");
    
    const videoBuffer = new Uint8Array(args.videoData);
    const result = await uploadRecording(args.interviewId, videoBuffer, args.mimeType);

    // Update interview with recording URL
    await ctx.runMutation(api.interviews.updateRecordingUrl, {
      interviewId: args.interviewId,
      recordingUrl: result.publicUrl || result.url,
    });

    // Also create recording metadata entry
    await ctx.runMutation(api.interviews.createRecordingMetadata, {
      interviewId: args.interviewId,
      r2Key: result.key,
      r2Url: result.url,
      publicUrl: result.publicUrl,
      fileSize: result.fileSize,
      mimeType: args.mimeType,
    });

    return result;
  },
});

/**
 * Update interview recording URL (internal)
 */
export const updateRecordingUrl = mutation({
  args: {
    interviewId: v.id("interviews"),
    recordingUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interviewId, {
      recordingUrl: args.recordingUrl,
    });
  },
});

/**
 * Create recording metadata (internal)
 */
export const createRecordingMetadata = mutation({
  args: {
    interviewId: v.id("interviews"),
    r2Key: v.string(),
    r2Url: v.string(),
    publicUrl: v.optional(v.string()),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("recordings", {
      interviewId: args.interviewId,
      r2Key: args.r2Key,
      r2Url: args.r2Url,
      publicUrl: args.publicUrl,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
    });
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
    // Check if response already exists for this question (for follow-ups)
    const existing = await ctx.db
      .query("interviewResponses")
      .withIndex("interviewId_questionId", (q) =>
        q.eq("interviewId", args.interviewId).eq("questionId", args.questionId)
      )
      .first();

    if (existing) {
      // Update existing response with follow-up data
      const currentFollowUps = existing.followUpQuestions || [];
      const currentFollowUpAnswers = existing.followUpAnswers || [];
      
      await ctx.db.patch(existing._id, {
        candidateAnswer: args.candidateAnswer,
        score: Math.max(existing.score, args.score), // Keep highest score
        evaluationFeedback: args.evaluationFeedback || existing.evaluationFeedback,
        followUpQuestions: [...currentFollowUps, ...(args.followUpQuestions || [])],
        followUpAnswers: [...currentFollowUpAnswers, args.candidateAnswer],
      });
      return existing._id;
    }

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

