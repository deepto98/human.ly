/**
 * OpenAI Integration
 * Handles LLM operations for question generation and evaluation
 */

import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY } from "../env";

// Initialize OpenAI LLM
function getLLM(temperature: number = 0.7) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    modelName: "gpt-4-turbo-preview",
    temperature,
  });
}

/**
 * Generate MCQ questions from content
 */
export async function generateMCQs(
  content: string,
  count: number,
  marksPerQuestion: number
): Promise<
  Array<{
    questionText: string;
    options: string[];
    correctOption: number;
    marks: number;
  }>
> {
  const llm = getLLM(0.8);

  const prompt = `You are an expert at creating multiple-choice questions for interviews and assessments.

Based on the following content, generate exactly ${count} multiple-choice questions.

Content:
"""
${content}
"""

Requirements:
- Each question should have 4 options (A, B, C, D)
- Questions should test understanding, not just memorization
- Vary the difficulty levels
- Mark each question as worth ${marksPerQuestion} marks
- One option must be clearly correct

Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "The question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": 0,
    "marks": ${marksPerQuestion}
  }
]

Return only the JSON array, no additional text.`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse MCQ JSON from LLM response");
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions.slice(0, count); // Ensure we return exactly the requested count
  } catch (error) {
    console.error("Error generating MCQs:", error);
    throw new Error("Failed to generate MCQ questions");
  }
}

/**
 * Generate subjective (essay) questions from content
 */
export async function generateSubjectiveQuestions(
  content: string,
  count: number,
  marksPerQuestion: number
): Promise<
  Array<{
    questionText: string;
    keyPoints: string[];
    marks: number;
  }>
> {
  const llm = getLLM(0.8);

  const prompt = `You are an expert at creating subjective interview questions that test deep understanding.

Based on the following content, generate exactly ${count} subjective (essay-type) questions.

Content:
"""
${content}
"""

Requirements:
- Questions should require detailed, thoughtful answers
- For each question, provide 3-5 key points that a good answer should cover
- Vary the difficulty and scope of questions
- Each question is worth ${marksPerQuestion} marks

Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "Explain the concept...",
    "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "marks": ${marksPerQuestion}
  }
]

Return only the JSON array, no additional text.`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse subjective questions JSON from LLM response");
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions.slice(0, count);
  } catch (error) {
    console.error("Error generating subjective questions:", error);
    throw new Error("Failed to generate subjective questions");
  }
}

/**
 * Evaluate a subjective answer against key points
 */
export async function evaluateSubjectiveAnswer(
  questionText: string,
  keyPoints: string[],
  candidateAnswer: string,
  maxMarks: number
): Promise<{
  score: number;
  feedback: string;
  coveredPoints: string[];
  missedPoints: string[];
}> {
  const llm = getLLM(0.3); // Lower temperature for consistent evaluation

  const prompt = `You are an expert evaluator for interview responses.

Question: ${questionText}

Key Points (that should be covered):
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

Candidate's Answer:
"""
${candidateAnswer}
"""

Evaluate the answer and:
1. Assign a score out of ${maxMarks} marks
2. Provide brief constructive feedback
3. List which key points were covered
4. List which key points were missed

Return ONLY valid JSON with this structure:
{
  "score": <number between 0 and ${maxMarks}>,
  "feedback": "Brief feedback here",
  "coveredPoints": ["Point text", ...],
  "missedPoints": ["Point text", ...]
}

Be fair and consider partial credit. Return only JSON, no additional text.`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse evaluation JSON from LLM response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    
    // Ensure score is within bounds
    evaluation.score = Math.min(Math.max(evaluation.score, 0), maxMarks);
    
    return evaluation;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    // Return a default evaluation on error
    return {
      score: 0,
      feedback: "Error evaluating response. Please review manually.",
      coveredPoints: [],
      missedPoints: keyPoints,
    };
  }
}

/**
 * Generate a follow-up question based on candidate's answer
 */
export async function generateFollowUpQuestion(
  originalQuestion: string,
  candidateAnswer: string,
  context: string
): Promise<string> {
  const llm = getLLM(0.8);

  const prompt = `You are conducting an interview. Based on the candidate's answer, generate ONE thoughtful follow-up question.

Original Question: ${originalQuestion}

Candidate's Answer:
"""
${candidateAnswer}
"""

Context/Topic:
"""
${context}
"""

Generate a natural, conversational follow-up question that:
- Probes deeper into their understanding
- Clarifies unclear points
- Explores related concepts
- Feels like a natural conversation

Return ONLY the follow-up question, nothing else.`;

  try {
    const response = await llm.invoke(prompt);
    return (response.content as string).trim().replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return "Can you elaborate more on that point?";
  }
}

/**
 * Generate questions from a general topic (no specific content)
 */
export async function generateQuestionsFromTopic(
  topic: string,
  mcqCount: number,
  subjectiveCount: number,
  marksPerMCQ: number,
  marksPerSubjective: number
): Promise<{
  mcqs: Array<{
    questionText: string;
    options: string[];
    correctOption: number;
    marks: number;
  }>;
  subjective: Array<{
    questionText: string;
    keyPoints: string[];
    marks: number;
  }>;
}> {
  const llm = getLLM(0.8);

  const prompt = `You are creating an interview assessment for the topic: "${topic}"

Generate:
- ${mcqCount} multiple-choice questions (4 options each, ${marksPerMCQ} marks each)
- ${subjectiveCount} subjective questions (with 3-5 key points each, ${marksPerSubjective} marks each)

Questions should cover various aspects and difficulty levels of ${topic}.

Return ONLY valid JSON with this structure:
{
  "mcqs": [
    {
      "questionText": "Question here?",
      "options": ["A", "B", "C", "D"],
      "correctOption": 0,
      "marks": ${marksPerMCQ}
    }
  ],
  "subjective": [
    {
      "questionText": "Question here?",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "marks": ${marksPerSubjective}
    }
  ]
}

Return only JSON, no additional text.`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions JSON from LLM response");
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error("Error generating questions from topic:", error);
    throw new Error("Failed to generate questions from topic");
  }
}

