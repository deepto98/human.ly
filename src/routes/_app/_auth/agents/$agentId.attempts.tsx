import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { ArrowLeft, User, Calendar, Award, Eye } from "lucide-react";
import { cn } from "@/utils/misc";

export const Route = createFileRoute("/_app/_auth/agents/$agentId/attempts")({
  component: AgentAttemptsPage,
});

function AgentAttemptsPage() {
  const { agentId } = Route.useParams();
  
  const { data: agent } = useQuery(
    convexQuery(api.agents.getAgent, { agentId: agentId as any })
  );
  
  const { data: interviews } = useQuery(
    convexQuery(api.interviews.getInterviewsByAgent, { agentId: agentId as any })
  );

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="mb-2 text-5xl font-black text-black">{agent.name}</h1>
          <p className="text-lg text-gray-700 font-medium">
            Interview Attempts & Results
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-cyan-200 p-6">
              <div className="text-3xl font-black mb-1">{interviews?.length || 0}</div>
              <div className="text-sm font-bold uppercase">Total Attempts</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-lime-200 p-6">
              <div className="text-3xl font-black mb-1">
                {interviews?.filter(i => i.status === "completed").length || 0}
              </div>
              <div className="text-sm font-bold uppercase">Completed</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-orange-200 p-6">
              <div className="text-3xl font-black mb-1">
                {interviews?.filter(i => i.status === "in_progress").length || 0}
              </div>
              <div className="text-sm font-bold uppercase">In Progress</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-pink-200 p-6">
              <div className="text-3xl font-black mb-1">{agent.totalMarks}</div>
              <div className="text-sm font-bold uppercase">Max Score</div>
            </div>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-6">
            <h2 className="mb-6 text-3xl font-black">All Attempts</h2>

            {interviews && interviews.length > 0 ? (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <div key={interview._id} className="relative">
                    <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                    <div className="relative border-[3px] border-black bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-bold uppercase text-gray-600 mb-1">Candidate</div>
                            <div className="font-bold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {interview.candidateName}
                            </div>
                            <div className="text-sm text-gray-600">{interview.candidateEmail}</div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase text-gray-600 mb-1">Date</div>
                            <div className="font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(interview.startedAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(interview.startedAt).toLocaleTimeString()}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase text-gray-600 mb-1">Score</div>
                            <div className="font-black text-2xl flex items-center gap-2">
                              <Award className="h-5 w-5" />
                              {interview.totalScore} / {interview.maxScore}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase text-gray-600 mb-1">Status</div>
                            <div className={cn(
                              "inline-block border-[2px] border-black px-3 py-1 font-bold uppercase text-xs",
                              interview.status === "completed" ? "bg-lime-300" :
                              interview.status === "in_progress" ? "bg-orange-300" :
                              "bg-gray-300"
                            )}>
                              {interview.status}
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/agents/${agentId}/attempts/${interview._id}`}
                          className="ml-4"
                        >
                          <div className="relative">
                            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                            <div className="relative flex items-center gap-2 border-[3px] border-black bg-cyan-300 px-4 py-2 font-bold hover:bg-cyan-400 transition-colors">
                              <Eye className="h-4 w-4" />
                              View
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p className="text-lg font-medium">No attempts yet</p>
                <p className="text-sm">Share your interview link to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

