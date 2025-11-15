import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Link2, Play, Users, BarChart3 } from "lucide-react";
import { cn } from "@/utils/misc.js";
import siteConfig from "~/site.config";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/")({
  component: Dashboard,
  beforeLoad: () => ({
    title: `${siteConfig.siteTitle} - Dashboard`,
    headerTitle: "Dashboard",
    headerDescription: "Manage your interview agents.",
  }),
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useQuery(
    convexQuery(api.agents.getMyAgents, {})
  );
  const deleteAgent = useConvexMutation(api.agents.deleteAgent);

  const handleCreateAgent = () => {
    navigate({ to: "/agents/create/knowledge-sources" });
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await deleteAgent.mutateAsync({ agentId: agentId as any });
    }
  };

  const copyShareLink = (link: string) => {
    const fullUrl = `${window.location.origin}/interview/${link}`;
    navigator.clipboard.writeText(fullUrl);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-black">Your Agents</h1>
            <p className="mt-2 text-lg text-gray-700 font-medium">
              Create and manage AI interview agents
            </p>
          </div>
          
          <button
            onClick={handleCreateAgent}
            className="group relative"
          >
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative flex items-center gap-2 border-[4px] border-black bg-orange-400 px-6 py-3 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
              <Plus className="h-5 w-5" />
              Create Agent
            </div>
          </button>
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg font-bold">Loading agents...</div>
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <motion.div
                key={agent._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-6 transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                  {/* Agent Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-1">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          "px-2 py-1 border-[2px] border-black font-bold uppercase text-xs",
                          agent.isPublished ? "bg-lime-300" : "bg-gray-200"
                        )}>
                          {agent.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteAgent(agent._id)}
                      className="p-2 border-[2px] border-black hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="border-[2px] border-black bg-cyan-100 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Attempts</span>
                      </div>
                      <div className="text-2xl font-black">{agent.interviewCount || 0}</div>
                    </div>
                    
                    <div className="border-[2px] border-black bg-lime-100 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Completed</span>
                      </div>
                      <div className="text-2xl font-black">{agent.completedCount || 0}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-4 text-sm text-gray-700 space-y-1">
                    <div><span className="font-bold">Style:</span> {agent.conversationalStyle}</div>
                    <div><span className="font-bold">Total Marks:</span> {agent.totalMarks}</div>
                    <div><span className="font-bold">Created:</span> {new Date(agent.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {agent.isPublished ? (
                      <>
                        <button
                          onClick={() => copyShareLink(agent.shareableLink)}
                          className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-lime-300 px-4 py-2 font-bold hover:bg-lime-400 transition-colors"
                        >
                          <Link2 className="h-4 w-4" />
                          Copy Link
                        </button>
                        <Link
                          to={`/agents/${agent._id}/attempts`}
                          className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-cyan-300 px-4 py-2 font-bold hover:bg-cyan-400 transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          View
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/agents/${agent._id}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-orange-300 px-4 py-2 font-bold hover:bg-orange-400 transition-colors"
                      >
                        Continue Setup
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-12 text-center">
              <div className="mx-auto mb-6 inline-block">
                <div className="relative">
                  <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                  <div className="relative border-[3px] border-black bg-orange-200 p-6">
                    <Plus className="h-16 w-16" />
                  </div>
                </div>
              </div>
              
              <h2 className="mb-2 text-4xl font-black text-black">
                No Agents Yet
              </h2>
              <p className="mb-6 text-lg text-gray-700 font-medium">
                Create your first AI interview agent to get started
              </p>
              
              <button
                onClick={handleCreateAgent}
                className="group relative inline-block"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative flex items-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                  <Plus className="h-6 w-6" />
                  Create Your First Agent
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
