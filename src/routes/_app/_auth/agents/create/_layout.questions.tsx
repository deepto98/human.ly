import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, useConvexAction, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, Plus, X, Edit2, Trash2, GripVertical, ArrowRight } from "lucide-react";
import { cn } from "@/utils/misc";
import { z } from "zod";

export const Route = createFileRoute("/_app/_auth/agents/create/_layout/questions")({
  component: QuestionsPage,
  validateSearch: z.object({
    agentId: z.string(),
  }),
});

type QuestionType = "mcq" | "subjective";

interface Question {
  _id: string;
  type: QuestionType;
  questionText: string;
  order: number;
  marks: number;
  options?: string[];
  correctOption?: number;
  keyPoints?: string[];
}

function QuestionsPage() {
  const { agentId } = Route.useSearch();
  const navigate = useNavigate();
  
  const [mcqCount, setMcqCount] = useState(5);
  const [subjectiveCount, setSubjectiveCount] = useState(3);
  const [marksPerMCQ, setMarksPerMCQ] = useState(2);
  const [marksPerSubjective, setMarksPerSubjective] = useState(10);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  const { data: questions, refetch } = useQuery(
    convexQuery(api.questions.getQuestionsByAgent, { agentId: agentId as any })
  );
  
  const generateQuestions = useConvexAction(api.questions.generateQuestions);
  const updateQuestion = useConvexMutation(api.questions.updateQuestion);
  const deleteQuestion = useConvexMutation(api.questions.deleteQuestion);
  const createQuestion = useConvexMutation(api.questions.createQuestion);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateQuestions({
        agentId: agentId as any,
        mcqCount,
        subjectiveCount,
        marksPerMCQ,
        marksPerSubjective,
      });
      await refetch();
    } catch (error) {
      console.error(error);
      alert("Failed to generate questions. Please check your API keys.");
    }
    setIsGenerating(false);
  };

  const handleContinue = () => {
    navigate({ to: "/agents/create/behavior", search: { agentId } });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("Delete this question?")) {
      await deleteQuestion({ questionId: questionId as any });
      await refetch();
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-black text-black">Build Questionnaire</h1>
          <p className="text-lg text-gray-700 font-medium">
            Generate and customize interview questions
          </p>
        </div>

        {/* Configuration Section */}
        {(!questions || questions.length === 0) && (
          <div className="relative mb-8">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-8">
              <h2 className="mb-6 text-3xl font-black">Question Configuration</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* MCQ Config */}
                <div className="relative">
                  <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                  <div className="relative border-[3px] border-black bg-cyan-100 p-6">
                    <h3 className="mb-4 text-xl font-bold">Multiple Choice</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-bold uppercase">
                          Number of MCQs
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={mcqCount}
                          onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                          className="border-[3px] border-black p-3 text-lg"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold uppercase">
                          Marks per MCQ
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={marksPerMCQ}
                          onChange={(e) => setMarksPerMCQ(parseInt(e.target.value) || 1)}
                          className="border-[3px] border-black p-3 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subjective Config */}
                <div className="relative">
                  <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                  <div className="relative border-[3px] border-black bg-lime-100 p-6">
                    <h3 className="mb-4 text-xl font-bold">Subjective</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-bold uppercase">
                          Number of Subjective
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={subjectiveCount}
                          onChange={(e) => setSubjectiveCount(parseInt(e.target.value) || 0)}
                          className="border-[3px] border-black p-3 text-lg"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold uppercase">
                          Marks per Question
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={marksPerSubjective}
                          onChange={(e) => setMarksPerSubjective(parseInt(e.target.value) || 1)}
                          className="border-[3px] border-black p-3 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Marks */}
              <div className="mt-6 text-center">
                <div className="inline-block border-[3px] border-black bg-orange-200 px-6 py-3">
                  <span className="text-lg font-bold uppercase">Total Marks: </span>
                  <span className="text-3xl font-black">
                    {mcqCount * marksPerMCQ + subjectiveCount * marksPerSubjective}
                  </span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (mcqCount === 0 && subjectiveCount === 0)}
                className="relative mt-6 w-full group"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className={cn(
                  "relative flex items-center justify-center gap-2 border-[4px] border-black px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]",
                  isGenerating ? "bg-gray-300" : "bg-orange-400"
                )}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6" />
                      Generate Questions
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions && questions.length > 0 && (
          <>
            <div className="relative mb-8">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-3xl font-black">
                    Generated Questions ({questions.length})
                  </h2>
                  <div className="text-lg font-bold">
                    Total: {questions.reduce((sum, q) => sum + q.marks, 0)} marks
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question._id} className="relative">
                      <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                      <div className={cn(
                        "relative border-[3px] border-black p-4",
                        question.type === "mcq" ? "bg-cyan-50" : "bg-lime-50"
                      )}>
                        {/* Question Header */}
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="border-[2px] border-black bg-white px-3 py-1 font-bold">
                              Q{index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className={cn(
                                  "border-[2px] border-black px-2 py-1 text-xs font-bold uppercase",
                                  question.type === "mcq" ? "bg-cyan-200" : "bg-lime-200"
                                )}>
                                  {question.type === "mcq" ? "MCQ" : "Subjective"}
                                </span>
                                <span className="border-[2px] border-black bg-orange-200 px-2 py-1 text-xs font-bold">
                                  {question.marks} marks
                                </span>
                              </div>
                              <p className="font-medium text-lg">{question.questionText}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="p-2 border-[2px] border-black hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* MCQ Options */}
                        {question.type === "mcq" && question.options && (
                          <div className="ml-16 space-y-2">
                            {question.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                className={cn(
                                  "border-[2px] border-black p-2 font-medium",
                                  optIdx === question.correctOption
                                    ? "bg-lime-300"
                                    : "bg-white"
                                )}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                {option}
                                {optIdx === question.correctOption && (
                                  <span className="ml-2 text-xs font-bold text-green-700">✓ CORRECT</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Subjective Key Points */}
                        {question.type === "subjective" && question.keyPoints && (
                          <div className="ml-16 space-y-1">
                            <p className="text-sm font-bold uppercase mb-2">Key Points:</p>
                            {question.keyPoints.map((point, pointIdx) => (
                              <div key={pointIdx} className="flex gap-2">
                                <span className="font-bold">•</span>
                                <span className="text-sm">{point}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  className="relative mt-6 w-full group"
                >
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                    Continue to Agent Setup
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

