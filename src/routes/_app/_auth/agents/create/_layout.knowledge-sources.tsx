import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, useConvexAction } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, Plus, X, Search, Upload, Link as LinkIcon, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/utils/misc";

export const Route = createFileRoute("/_app/_auth/agents/create/_layout/knowledge-sources")({
  component: KnowledgeSourcesPage,
});

type SourceType = "topic" | "url" | "search" | "document";

interface SearchResult {
  url: string;
  title: string;
  description: string;
}

function KnowledgeSourcesPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Topic state
  const [topic, setTopic] = useState("");

  // URL state
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  // Document state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Mutations
  const createAgent = useConvexMutation(api.agents.createAgent);
  const addTopicSource = useConvexMutation(api.knowledgeSources.addTopicSource);
  const addUrlSource = useConvexAction(api.knowledgeSources.addUrlSource);
  const searchWeb = useConvexAction(api.knowledgeSources.searchWebForSources);
  const addWebSearchSources = useConvexAction(api.knowledgeSources.addWebSearchSources);

  // Initialize agent on mount
  useState(() => {
    createAgent.mutate({}, {
      onSuccess: (id) => setAgentId(id as string),
    });
  });

  const handleTopicSubmit = async () => {
    if (!agentId || !topic.trim()) return;

    await addTopicSource.mutateAsync({
      agentId: agentId as any,
      topic: topic.trim(),
    });

    navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
  };

  const handleAddUrl = () => {
    if (urlInput.trim() && !urls.includes(urlInput.trim())) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleRemoveUrl = (url: string) => {
    setUrls(urls.filter((u) => u !== url));
  };

  const handleUrlsSubmit = async () => {
    if (!agentId || urls.length === 0) return;

    for (const url of urls) {
      await addUrlSource.mutateAsync({
        agentId: agentId as any,
        url,
      });
    }

    navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const results = await searchWeb.mutateAsync({
      query: searchQuery.trim(),
      maxResults: 10,
    });

    setSearchResults(results as SearchResult[]);
  };

  const toggleUrlSelection = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const handleSearchSubmit = async () => {
    if (!agentId || selectedUrls.size === 0) return;

    await addWebSearchSources.mutateAsync({
      agentId: agentId as any,
      urls: Array.from(selectedUrls),
    });

    navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  if (!agentId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-black text-black">Define Knowledge Sources</h1>
          <p className="text-lg text-gray-700 font-medium">
            Choose how to generate interview questions
          </p>
        </div>

        {/* Source Type Selection */}
        {!selectedType && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Topic */}
            <button
              onClick={() => setSelectedType("topic")}
              className="group relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-cyan-300 p-6 h-full transition-all hover:translate-x-1 hover:translate-y-1">
                <Lightbulb className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Topic</h3>
                <p className="text-sm text-gray-800">
                  AI generates questions from general knowledge
                </p>
              </div>
            </button>

            {/* URLs */}
            <button
              onClick={() => setSelectedType("url")}
              className="group relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-lime-300 p-6 h-full transition-all hover:translate-x-1 hover:translate-y-1">
                <LinkIcon className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">URLs</h3>
                <p className="text-sm text-gray-800">
                  Scrape specific websites for content
                </p>
              </div>
            </button>

            {/* Web Search */}
            <button
              onClick={() => setSelectedType("search")}
              className="group relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-pink-300 p-6 h-full transition-all hover:translate-x-1 hover:translate-y-1">
                <Search className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Web Search</h3>
                <p className="text-sm text-gray-800">
                  Search and select relevant pages
                </p>
              </div>
            </button>

            {/* Documents */}
            <button
              onClick={() => setSelectedType("document")}
              className="group relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-orange-300 p-6 h-full transition-all hover:translate-x-1 hover:translate-y-1">
                <Upload className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Documents</h3>
                <p className="text-sm text-gray-800">
                  Upload PDFs, DOCX files
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Topic Input */}
        {selectedType === "topic" && (
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-8">
              <button
                onClick={() => setSelectedType(null)}
                className="mb-4 text-sm font-bold uppercase hover:underline"
              >
                ← Back
              </button>
              <h2 className="mb-4 text-3xl font-black">Enter a Topic</h2>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Microsoft Excel, Python Programming, Marketing Strategy"
                className="mb-4 border-[3px] border-black text-lg p-4"
              />
              <Button
                onClick={handleTopicSubmit}
                disabled={!topic.trim() || addTopicSource.isPending}
                className="relative border-[3px] border-black bg-orange-400 px-8 py-4 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {addTopicSource.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                ) : null}
                Continue
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </Button>
            </div>
          </div>
        )}

        {/* URL Input */}
        {selectedType === "url" && (
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-8">
              <button
                onClick={() => setSelectedType(null)}
                className="mb-4 text-sm font-bold uppercase hover:underline"
              >
                ← Back
              </button>
              <h2 className="mb-4 text-3xl font-black">Add Website URLs</h2>
              <div className="flex gap-2 mb-4">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddUrl()}
                  placeholder="https://example.com"
                  className="flex-1 border-[3px] border-black text-lg p-4"
                />
                <Button
                  onClick={handleAddUrl}
                  className="border-[3px] border-black bg-cyan-300 px-6 font-bold"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {urls.length > 0 && (
                <div className="mb-4 space-y-2">
                  {urls.map((url) => (
                    <div key={url} className="flex items-center gap-2 border-[2px] border-black bg-gray-100 p-3">
                      <span className="flex-1 text-sm break-all">{url}</span>
                      <button
                        onClick={() => handleRemoveUrl(url)}
                        className="p-1 hover:bg-red-200 border-[2px] border-black"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleUrlsSubmit}
                disabled={urls.length === 0 || addUrlSource.isPending}
                className="relative border-[3px] border-black bg-orange-400 px-8 py-4 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {addUrlSource.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                ) : null}
                Scrape & Continue
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </Button>
            </div>
          </div>
        )}

        {/* Web Search */}
        {selectedType === "search" && (
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-8">
              <button
                onClick={() => setSelectedType(null)}
                className="mb-4 text-sm font-bold uppercase hover:underline"
              >
                ← Back
              </button>
              <h2 className="mb-4 text-3xl font-black">Search the Web</h2>
              <div className="flex gap-2 mb-6">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for a topic..."
                  className="flex-1 border-[3px] border-black text-lg p-4"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searchWeb.isPending}
                  className="border-[3px] border-black bg-pink-300 px-6 font-bold"
                >
                  {searchWeb.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    {searchResults.map((result) => (
                      <div
                        key={result.url}
                        onClick={() => toggleUrlSelection(result.url)}
                        className={cn(
                          "cursor-pointer border-[3px] border-black p-4 transition-all",
                          selectedUrls.has(result.url)
                            ? "bg-lime-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            : "bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <h4 className="font-bold mb-1">{result.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                        <p className="text-xs text-gray-500 break-all">{result.url}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSearchSubmit}
                    disabled={selectedUrls.size === 0 || addWebSearchSources.isPending}
                    className="relative border-[3px] border-black bg-orange-400 px-8 py-4 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {addWebSearchSources.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                    ) : null}
                    Scrape {selectedUrls.size} Selected
                    <ArrowRight className="h-5 w-5 ml-2 inline" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Document Upload - Placeholder for now */}
        {selectedType === "document" && (
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-white p-8">
              <button
                onClick={() => setSelectedType(null)}
                className="mb-4 text-sm font-bold uppercase hover:underline"
              >
                ← Back
              </button>
              <h2 className="mb-4 text-3xl font-black">Upload Documents</h2>
              <div className="mb-4 border-[3px] border-dashed border-black p-12 text-center">
                <Upload className="h-16 w-16 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                  className="mb-2"
                />
                <p className="text-sm text-gray-600">
                  Upload PDF or DOCX files
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Document upload coming soon. Please use other options for now.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

