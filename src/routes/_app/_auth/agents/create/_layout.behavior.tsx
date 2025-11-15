import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/utils/misc";
import { z } from "zod";

export const Route = createFileRoute("/_app/_auth/agents/create/_layout/behavior")({
  component: BehaviorPage,
  validateSearch: z.object({
    agentId: z.string(),
  }),
});

function BehaviorPage() {
  const { agentId } = Route.useSearch();
  const navigate = useNavigate();
  
  const { data: agent } = useQuery(
    convexQuery(api.agents.getAgent, { agentId: agentId as any })
  );
  
  const updateAgent = useConvexMutation(api.agents.updateAgent);
  const publishAgent = useConvexMutation(api.agents.publishAgent);
  
  const [name, setName] = useState(agent?.name || "");
  const [gender, setGender] = useState(agent?.gender || "female");
  const [appearance, setAppearance] = useState(agent?.appearance || "default_avatar");
  const [voiceType, setVoiceType] = useState(agent?.voiceType || "default");
  const [conversationalStyle, setConversationalStyle] = useState(agent?.conversationalStyle || "formal");
  const [enableFollowUps, setEnableFollowUps] = useState(agent?.enableFollowUps ?? true);
  const [maxFollowUps, setMaxFollowUps] = useState(agent?.maxFollowUps || 2);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Update agent configuration
      await updateAgent.mutateAsync({
        agentId: agentId as any,
        name,
        gender: gender as any,
        appearance,
        voiceType,
        conversationalStyle: conversationalStyle as any,
        enableFollowUps,
        maxFollowUps,
      });
      
      // Publish the agent
      const result = await publishAgent.mutateAsync({
        agentId: agentId as any,
      });
      
      alert(`Agent published! Share this link: ${window.location.origin}/interview/${result.shareableLink}`);
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error(error);
      alert("Failed to publish agent. Make sure all fields are filled.");
    }
    setIsPublishing(false);
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-black text-black">Configure Agent</h1>
          <p className="text-lg text-gray-700 font-medium">
            Customize your AI interviewer's personality and behavior
          </p>
        </div>

        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8">
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="mb-2 block text-lg font-bold uppercase">
                  Agent Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jessica, Alex, Morgan"
                  className="border-[3px] border-black p-4 text-lg"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="mb-3 block text-lg font-bold uppercase">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["male", "female", "non_binary"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className="relative group"
                    >
                      <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                      <div className={cn(
                        "relative border-[3px] border-black p-4 font-bold uppercase transition-all",
                        gender === g ? "bg-orange-400" : "bg-white hover:bg-gray-100"
                      )}>
                        {g.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div>
                <label className="mb-2 block text-lg font-bold uppercase">
                  Appearance
                </label>
                <select
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-lg font-medium bg-white"
                >
                  <option value="default_avatar">Default Avatar</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>

              {/* Voice Type */}
              <div>
                <label className="mb-2 block text-lg font-bold uppercase">
                  Voice Type
                </label>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-lg font-medium bg-white"
                >
                  <option value="default">Default</option>
                  <option value="warm">Warm & Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="energetic">Energetic</option>
                </select>
              </div>

              {/* Conversational Style */}
              <div>
                <label className="mb-3 block text-lg font-bold uppercase">
                  Conversational Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["casual", "formal", "interrogative"].map((style) => (
                    <button
                      key={style}
                      onClick={() => setConversationalStyle(style)}
                      className="relative group"
                    >
                      <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                      <div className={cn(
                        "relative border-[3px] border-black p-4 font-bold uppercase transition-all",
                        conversationalStyle === style ? "bg-cyan-400" : "bg-white hover:bg-gray-100"
                      )}>
                        {style}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-ups Configuration */}
              <div className="relative">
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black bg-lime-100 p-6">
                  <h3 className="mb-4 text-xl font-bold">Follow-up Questions</h3>
                  
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      onClick={() => setEnableFollowUps(!enableFollowUps)}
                      className={cn(
                        "relative h-8 w-16 border-[3px] border-black transition-colors",
                        enableFollowUps ? "bg-lime-400" : "bg-gray-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 h-5 w-5 border-[2px] border-black bg-white transition-all",
                        enableFollowUps ? "right-0.5" : "left-0.5"
                      )}></div>
                    </button>
                    <span className="font-bold">
                      {enableFollowUps ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {enableFollowUps && (
                    <div>
                      <label className="mb-2 block text-sm font-bold uppercase">
                        Max Follow-ups per Subjective Question
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={maxFollowUps}
                        onChange={(e) => setMaxFollowUps(parseInt(e.target.value) || 1)}
                        className="border-[3px] border-black p-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Publish Button */}
              <button
                onClick={handlePublish}
                disabled={isPublishing || !name.trim()}
                className="relative w-full group"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className={cn(
                  "relative flex items-center justify-center gap-2 border-[4px] border-black px-8 py-5 font-bold uppercase text-xl transition-all hover:translate-x-[2px] hover:translate-y-[2px]",
                  isPublishing || !name.trim() ? "bg-gray-300" : "bg-orange-400"
                )}>
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Publishing Agent...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Publish Agent
                    </>
                  )}
                </div>
              </button>

              {/* Preview Option */}
              <div className="text-center">
                <button
                  className="text-sm font-bold underline hover:text-gray-600"
                >
                  Preview Agent (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

