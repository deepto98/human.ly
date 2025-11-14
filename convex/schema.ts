import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v, Infer } from "convex/values";

export const CURRENCIES = {
  USD: "usd",
  EUR: "eur",
} as const;
export const currencyValidator = v.union(
  v.literal(CURRENCIES.USD),
  v.literal(CURRENCIES.EUR),
);
export type Currency = Infer<typeof currencyValidator>;

export const INTERVALS = {
  MONTH: "month",
  YEAR: "year",
} as const;
export const intervalValidator = v.union(
  v.literal(INTERVALS.MONTH),
  v.literal(INTERVALS.YEAR),
);
export type Interval = Infer<typeof intervalValidator>;

export const PLANS = {
  FREE: "free",
  PRO: "pro",
} as const;
export const planKeyValidator = v.union(
  v.literal(PLANS.FREE),
  v.literal(PLANS.PRO),
);
export type PlanKey = Infer<typeof planKeyValidator>;

const priceValidator = v.object({
  stripeId: v.string(),
  amount: v.number(),
});
const pricesValidator = v.object({
  [CURRENCIES.USD]: priceValidator,
  [CURRENCIES.EUR]: priceValidator,
});

// Interview Agent Configuration
export const AGENT_GENDERS = {
  MALE: "male",
  FEMALE: "female",
  NON_BINARY: "non_binary",
} as const;
export const agentGenderValidator = v.union(
  v.literal(AGENT_GENDERS.MALE),
  v.literal(AGENT_GENDERS.FEMALE),
  v.literal(AGENT_GENDERS.NON_BINARY),
);
export type AgentGender = Infer<typeof agentGenderValidator>;

export const CONVERSATIONAL_STYLES = {
  CASUAL: "casual",
  FORMAL: "formal",
  INTERROGATIVE: "interrogative",
} as const;
export const conversationalStyleValidator = v.union(
  v.literal(CONVERSATIONAL_STYLES.CASUAL),
  v.literal(CONVERSATIONAL_STYLES.FORMAL),
  v.literal(CONVERSATIONAL_STYLES.INTERROGATIVE),
);
export type ConversationalStyle = Infer<typeof conversationalStyleValidator>;

export const KNOWLEDGE_SOURCE_TYPES = {
  TOPIC: "topic",
  URL: "url",
  WEB_SEARCH: "web_search",
  DOCUMENT: "document",
} as const;
export const knowledgeSourceTypeValidator = v.union(
  v.literal(KNOWLEDGE_SOURCE_TYPES.TOPIC),
  v.literal(KNOWLEDGE_SOURCE_TYPES.URL),
  v.literal(KNOWLEDGE_SOURCE_TYPES.WEB_SEARCH),
  v.literal(KNOWLEDGE_SOURCE_TYPES.DOCUMENT),
);
export type KnowledgeSourceType = Infer<typeof knowledgeSourceTypeValidator>;

export const QUESTION_TYPES = {
  MCQ: "mcq",
  SUBJECTIVE: "subjective",
} as const;
export const questionTypeValidator = v.union(
  v.literal(QUESTION_TYPES.MCQ),
  v.literal(QUESTION_TYPES.SUBJECTIVE),
);
export type QuestionType = Infer<typeof questionTypeValidator>;

export const INTERVIEW_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;
export const interviewStatusValidator = v.union(
  v.literal(INTERVIEW_STATUS.PENDING),
  v.literal(INTERVIEW_STATUS.IN_PROGRESS),
  v.literal(INTERVIEW_STATUS.COMPLETED),
  v.literal(INTERVIEW_STATUS.ABANDONED),
);
export type InterviewStatus = Infer<typeof interviewStatusValidator>;

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    customerId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("customerId", ["customerId"]),
  plans: defineTable({
    key: planKeyValidator,
    stripeId: v.string(),
    name: v.string(),
    description: v.string(),
    prices: v.object({
      [INTERVALS.MONTH]: pricesValidator,
      [INTERVALS.YEAR]: pricesValidator,
    }),
  })
    .index("key", ["key"])
    .index("stripeId", ["stripeId"]),
  subscriptions: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    priceStripeId: v.string(),
    stripeId: v.string(),
    currency: currencyValidator,
    interval: intervalValidator,
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index("userId", ["userId"])
    .index("stripeId", ["stripeId"]),
  
  // Interview Agents - stores configuration for AI interview agents
  interviewAgents: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    gender: agentGenderValidator,
    appearance: v.string(), // Avatar image URL or avatar service ID
    voiceType: v.string(), // Voice profile identifier
    conversationalStyle: conversationalStyleValidator,
    enableFollowUps: v.boolean(),
    maxFollowUps: v.number(), // Max follow-up questions per subjective question
    shareableLink: v.string(), // Unique link for candidates
    isPublished: v.boolean(),
    totalMarks: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("creatorId", ["creatorId"])
    .index("shareableLink", ["shareableLink"])
    .index("isPublished", ["isPublished"]),
  
  // Knowledge Sources - tracks sources used to generate questions
  knowledgeSources: defineTable({
    agentId: v.id("interviewAgents"),
    type: knowledgeSourceTypeValidator,
    content: v.string(), // Topic text, URL, search query, or document filename
    scrapedContent: v.optional(v.string()), // Scraped/extracted text content
    documentUrl: v.optional(v.string()), // R2 URL for uploaded documents
    metadata: v.optional(v.any()), // Additional metadata (search results, etc.)
    createdAt: v.number(),
  })
    .index("agentId", ["agentId"]),
  
  // Questions - stores generated MCQ/subjective questions
  questions: defineTable({
    agentId: v.id("interviewAgents"),
    type: questionTypeValidator,
    questionText: v.string(),
    order: v.number(), // Display order in questionnaire
    marks: v.number(),
    // For MCQ questions
    options: v.optional(v.array(v.string())), // Array of 4 options
    correctOption: v.optional(v.number()), // Index of correct option (0-3)
    // For Subjective questions
    keyPoints: v.optional(v.array(v.string())), // 3-5 key points for evaluation
    createdAt: v.number(),
  })
    .index("agentId", ["agentId"])
    .index("agentId_order", ["agentId", "order"]),
  
  // Interviews - tracks interview sessions
  interviews: defineTable({
    agentId: v.id("interviewAgents"),
    candidateName: v.string(),
    candidateEmail: v.string(),
    candidateUserId: v.optional(v.id("users")), // If candidate is logged in
    status: interviewStatusValidator,
    totalScore: v.number(),
    maxScore: v.number(),
    recordingUrl: v.optional(v.string()), // R2 URL for webcam + screen recording
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional session metadata
  })
    .index("agentId", ["agentId"])
    .index("candidateEmail", ["candidateEmail"])
    .index("status", ["status"])
    .index("agentId_status", ["agentId", "status"]),
  
  // Interview Responses - stores candidate answers for each question
  interviewResponses: defineTable({
    interviewId: v.id("interviews"),
    questionId: v.id("questions"),
    candidateAnswer: v.string(), // Text answer or selected option
    isCorrect: v.optional(v.boolean()), // For MCQ
    score: v.number(), // Marks awarded
    evaluationFeedback: v.optional(v.string()), // AI evaluator feedback
    followUpQuestions: v.optional(v.array(v.string())), // Follow-up questions asked
    followUpAnswers: v.optional(v.array(v.string())), // Candidate's follow-up answers
    answeredAt: v.number(),
  })
    .index("interviewId", ["interviewId"])
    .index("questionId", ["questionId"])
    .index("interviewId_questionId", ["interviewId", "questionId"]),
  
  // Recordings - metadata for video recordings stored in R2
  recordings: defineTable({
    interviewId: v.id("interviews"),
    r2Key: v.string(), // S3/R2 object key
    r2Url: v.string(), // Full R2 URL
    publicUrl: v.optional(v.string()), // Public CDN URL if available
    fileSize: v.number(), // Size in bytes
    duration: v.optional(v.number()), // Duration in seconds
    mimeType: v.string(),
    uploadedAt: v.number(),
  })
    .index("interviewId", ["interviewId"])
    .index("r2Key", ["r2Key"]),
});

export default schema;
