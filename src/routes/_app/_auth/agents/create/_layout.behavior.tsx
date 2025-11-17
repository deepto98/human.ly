import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, ArrowRight, CheckCircle, Save } from "lucide-react";
import { cn } from "@/utils/misc";
import { z } from "zod";
import { AppLayout } from "@/ui/app-layout";
import { StepIndicator } from "@/ui/step-indicator";

export const Route = createFileRoute("/_app/_auth/agents/create/_layout/behavior")({
  component: BehaviorPage,
  validateSearch: z.object({
    sourceType: z.string().optional(),
    sourceContent: z.string().optional(),
    questions: z.string().optional(),
    totalMarks: z.string().optional(),
    agentId: z.string().optional(),
  }),
});

function BehaviorPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  
  const createAgent = useConvexMutation(api.agents.createAgent);
  const createQuestion = useConvexMutation(api.questions.createQuestion);
  const addTopicSource = useConvexMutation(api.knowledgeSources.addTopicSource);
  const updateAgent = useConvexMutation(api.agents.updateAgent);
  const publishAgent = useConvexMutation(api.agents.publishAgent);
  
  const [name, setName] = useState("Interview Agent");
  const [gender, setGender] = useState("female");
  const [appearance, setAppearance] = useState("default_avatar");
  const [voiceType, setVoiceType] = useState("default");
  const [conversationalStyle, setConversationalStyle] = useState("formal");
  const [enableFollowUps, setEnableFollowUps] = useState(true);
  const [maxFollowUps, setMaxFollowUps] = useState(2);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const saveAgent = async (publish: boolean = false) => {
    if (!name.trim()) {
      alert("Please enter an agent name");
      return;
    }

    try {
      // Step 1: Create the agent
      const agentId = await createAgent({});

      // Step 2: Update agent configuration
      const totalMarks = parseInt(searchParams.totalMarks || "0");
      await updateAgent({
        agentId: agentId as any,
        name,
        gender: gender as any,
        appearance,
        voiceType,
        conversationalStyle: conversationalStyle as any,
        enableFollowUps,
        maxFollowUps,
        totalMarks,
      });

      // Step 3: Add knowledge source
      if (searchParams.sourceType === "topic" && searchParams.sourceContent) {
        await addTopicSource({
          agentId: agentId as any,
          topic: searchParams.sourceContent,
        });
      }
      // For URL and web_search, we'd need to implement scraping here
      // For now, only topic is fully supported in this flow

      // Step 4: Create questions
      if (searchParams.questions) {
        const questions = JSON.parse(searchParams.questions);
        for (const question of questions) {
          await createQuestion({
            agentId: agentId as any,
            type: question.type,
            questionText: question.questionText,
            order: question.order,
            marks: question.marks,
            options: question.options,
            correctOption: question.correctOption,
            keyPoints: question.keyPoints,
          });
        }
      }

      // Step 5: Publish if requested
      if (publish) {
        const result = await publishAgent({
          agentId: agentId as any,
        });
        alert(`Agent published! Share this link: ${window.location.origin}/interview/${result.shareableLink}`);
      } else {
        alert("Agent saved as draft!");
      }

      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error(error);
      alert("Failed to save agent. Please try again.");
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await saveAgent(true);
    setIsPublishing(false);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    await saveAgent(false);
    setIsSavingDraft(false);
  };

  return (
    <AppLayout>
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          {/* Step Indicator */}
          <StepIndicator 
            currentStep={3}
            steps={[
              { number: 1, label: "Knowledge" },
              { number: 2, label: "Questions" },
              { number: 3, label: "Behavior" }
            ]}
          />

          {/* Header */}
          <div className="mb-8 text-center">
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
                <label className="mb-2 block text-lg font-bold uppercase text-black">
                  Appearance
                </label>
                <select
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-lg font-medium bg-white text-black"
                >
                  <option value="default_avatar">Default Avatar</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>

              {/* Voice Type */}
              <div>
                <label className="mb-2 block text-lg font-bold uppercase text-black">
                  Voice Type
                </label>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-lg font-medium bg-white text-black"
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {/* Save Draft Button */}
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || !name.trim()}
                  className="relative group"
                >
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className={cn(
                    "relative flex items-center justify-center gap-2 border-[4px] border-black px-6 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]",
                    isSavingDraft || !name.trim() ? "bg-gray-300" : "bg-cyan-300"
                  )}>
                    {isSavingDraft ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Draft"
                    )}
                  </div>
                </button>

                {/* Publish Button */}
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !name.trim()}
                  className="relative group"
                >
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className={cn(
                    "relative flex items-center justify-center gap-2 border-[4px] border-black px-6 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]",
                    isPublishing || !name.trim() ? "bg-gray-300" : "bg-orange-400"
                  )}>
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Publish
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Info Note */}
              <div className="text-center text-sm text-gray-600">
                <p>Save as draft to continue later, or publish to get a shareable link</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}

