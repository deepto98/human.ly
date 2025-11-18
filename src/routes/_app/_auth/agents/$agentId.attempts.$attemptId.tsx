import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { ArrowLeft, User, Calendar, Award, CheckCircle, XCircle, Video } from "lucide-react";
import { cn } from "@/utils/misc";

export const Route = createFileRoute("/_app/_auth/agents/$agentId/attempts/$attemptId")({
  component: AttemptDetailPage,
});

function AttemptDetailPage() {
  const { agentId, attemptId } = Route.useParams();
  
  const { data: interview } = useQuery(
    convexQuery(api.interviews.getInterview, { interviewId: attemptId as any })
  );
  
  const { data: responses } = useQuery(
    convexQuery(api.interviews.getInterviewResponses, { interviewId: attemptId as any })
  );

  if (!interview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  const percentage = interview.maxScore > 0 
    ? Math.round((interview.totalScore / interview.maxScore) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/agents/${agentId}/attempts`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Attempts
          </Link>
          
          <h1 className="mb-2 text-5xl font-black text-black">
            Interview Details
          </h1>
        </div>

        {/* Candidate Info & Score */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Candidate Info */}
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-6">
              <h2 className="mb-4 text-2xl font-black">Candidate</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold uppercase text-gray-600 mb-1">Name</div>
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <User className="h-5 w-5" />
                    {interview.candidateName}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-gray-600 mb-1">Email</div>
                  <div className="font-medium">{interview.candidateEmail}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-gray-600 mb-1">Date</div>
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4" />
                    {new Date(interview.startedAt).toLocaleDateString()} at{" "}
                    {new Date(interview.startedAt).toLocaleTimeString()}
                  </div>
                </div>
                {interview.completedAt && (
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-600 mb-1">Duration</div>
                    <div className="font-medium">
                      {Math.round((interview.completedAt - interview.startedAt) / 60000)} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-gradient-to-br from-orange-300 to-orange-400 p-6 text-center">
              <h2 className="mb-4 text-2xl font-black">Final Score</h2>
              <div className="mb-3">
                <div className="text-7xl font-black">{interview.totalScore}</div>
                <div className="text-3xl font-bold">/ {interview.maxScore}</div>
              </div>
              <div className="inline-block border-[3px] border-black bg-white px-4 py-2">
                <span className="text-2xl font-black">{percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Introduction */}
        {interview.candidateIntro && (
          <div className="relative mb-8">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-6">
              <h2 className="mb-4 text-2xl font-black">Candidate Introduction</h2>
              <div className="border-[3px] border-black bg-lime-50 p-4 font-medium">
                {interview.candidateIntro}
              </div>
            </div>
          </div>
        )}

        {/* Recordings */}
        {interview.recordingUrl && (
          <div className="relative mb-8">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-6">
              <h2 className="mb-4 text-2xl font-black flex items-center gap-2">
                <Video className="h-6 w-6" />
                Interview Recordings
              </h2>
              <div className="border-[3px] border-black">
                <video
                  src={interview.recordingUrl}
                  controls
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions & Answers */}
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-6">
            <h2 className="mb-6 text-3xl font-black">Questions & Answers</h2>

            {responses && responses.length > 0 ? (
              <div className="space-y-6">
                {responses.map((response, idx) => {
                  const question = response.question;
                  if (!question) return null;

                  return (
                    <div key={response._id} className="relative">
                      <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                      <div className={cn(
                        "relative border-[3px] border-black p-6",
                        question.type === "mcq" ? "bg-cyan-50" : "bg-lime-50"
                      )}>
                        {/* Question */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="border-[2px] border-black bg-white px-3 py-1 font-bold">
                              Q{idx + 1}
                            </div>
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
                          <p className="text-lg font-medium">{question.questionText}</p>
                        </div>

                        {/* Candidate's Answer */}
                        <div className="mb-3">
                          <div className="text-xs font-bold uppercase text-gray-600 mb-2">
                            Candidate's Answer:
                          </div>
                          <div className="border-[2px] border-black bg-white p-3 font-medium">
                            {question.type === "mcq" && question.options
                              ? `${String.fromCharCode(65 + parseInt(response.candidateAnswer))}. ${question.options[parseInt(response.candidateAnswer)]}`
                              : response.candidateAnswer}
                          </div>
                        </div>

                        {/* Evaluation */}
                        <div className="mb-3">
                          <div className="flex items-center gap-3 mb-3">
                            {response.isCorrect !== undefined && (
                              <div className={cn(
                                "flex items-center gap-2 border-[2px] border-black px-3 py-1 font-bold",
                                response.isCorrect ? "bg-lime-300" : "bg-red-200"
                              )}>
                                {response.isCorrect ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Correct
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Incorrect
                                  </>
                                )}
                              </div>
                            )}
                            <div className="border-[2px] border-black bg-orange-200 px-3 py-1 font-bold">
                              Score: {response.score} / {question.marks}
                            </div>
                          </div>

                          {/* Evaluation Feedback (Critique) - Only for subjective questions */}
                          {question.type === "subjective" && response.evaluationFeedback && (
                            <div className="mb-3">
                              <div className="text-xs font-bold uppercase text-gray-600 mb-1">
                                AI Evaluator's Critique:
                              </div>
                              <div className="border-[2px] border-black bg-cyan-50 p-3 text-sm font-medium">
                                {response.evaluationFeedback}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Follow-ups if any */}
                        {response.followUpQuestions && response.followUpQuestions.length > 0 && (
                          <div className="mt-4 pt-4 border-t-[2px] border-black">
                            <div className="text-xs font-bold uppercase text-gray-600 mb-3">
                              Follow-up Interaction:
                            </div>
                            {response.followUpQuestions.map((followUp, fIdx) => (
                              <div key={fIdx} className="mb-4 space-y-2">
                                <div className="border-[2px] border-black bg-cyan-100 p-3">
                                  <div className="text-xs font-bold uppercase mb-1">
                                    Agent's Follow-up Question:
                                  </div>
                                  <div className="text-sm font-medium">{followUp}</div>
                                </div>
                                {response.followUpAnswers?.[fIdx] && (
                                  <div className="border-[2px] border-black bg-lime-100 p-3 ml-4">
                                    <div className="text-xs font-bold uppercase mb-1">
                                      Candidate's Response:
                                    </div>
                                    <div className="text-sm font-medium">{response.followUpAnswers[fIdx]}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p>No responses recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

