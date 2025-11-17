import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

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
  useEffect(() => {
    const initAgent = async () => {
      if (!agentId && !isCreatingAgent) {
        setIsCreatingAgent(true);
        try {
          const id = await createAgent({});
          setAgentId(id as string);
          console.log("Agent created:", id);
        } catch (error) {
          console.error("Failed to create agent:", error);
          alert("Failed to create agent. Please make sure you're logged in.");
          navigate({ to: "/dashboard" });
        }
        setIsCreatingAgent(false);
      }
    };
    initAgent();
  }, []);

  const handleTopicSubmit = async () => {
    if (!agentId || !topic.trim()) return;

    await addTopicSource({
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

    setIsScrapingUrls(true);
    try {
      for (const url of urls) {
        await addUrlSource({
          agentId: agentId as any,
          url,
        });
      }

      navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
    } catch (error) {
      console.error("Failed to scrape URLs:", error);
      alert("Failed to scrape some URLs. Please check the URLs and try again.");
      setIsScrapingUrls(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    console.log("Starting search for:", searchQuery);
    setIsSearching(true);
    try {
      const results = await searchWeb({
        query: searchQuery.trim(),
        maxResults: 10,
      });

      console.log("Search results received:", results);
      setSearchResults(results as SearchResult[]);
      console.log("Search results state updated, count:", results.length);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Failed to search. Please check your Firecrawl API key.");
    } finally {
      setIsSearching(false);
      console.log("Search completed, isSearching set to false");
    }
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

    setIsScrapingUrls(true);
    try {
      await addWebSearchSources({
        agentId: agentId as any,
        urls: Array.from(selectedUrls),
      });

      navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
    } catch (error) {
      console.error("Failed to scrape sources:", error);
      alert("Failed to scrape selected websites. Please try again.");
      setIsScrapingUrls(false);
    }
  };

  const uploadDocumentSource = useConvexAction(api.knowledgeSources.uploadDocumentSource);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrapingUrls, setIsScrapingUrls] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !agentId) return;
    
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
    setIsUploading(true);

    try {
      for (const file of files) {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Upload and create knowledge source
        await uploadDocumentSource({
          agentId: agentId as any,
          filename: file.name,
          fileData: arrayBuffer,
          contentType: file.type || "application/pdf",
        });
      }

      // Navigate to next step
      navigate({ to: "/agents/create/questions", search: { agentId: agentId } });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload documents. Please check your R2 configuration.");
      setIsUploading(false);
    }
  };

  if (!agentId || isCreatingAgent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold">Creating your agent...</p>
        </div>
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
              <button
                onClick={handleTopicSubmit}
                disabled={!topic.trim()}
                className="relative w-full group"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </div>
              </button>
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

              <button
                onClick={handleUrlsSubmit}
                disabled={urls.length === 0 || isScrapingUrls}
                className="relative w-full group"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                  {isScrapingUrls ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      Scrape & Continue
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </div>
              </button>
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
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="border-[3px] border-black bg-pink-300 px-6 py-3 font-bold hover:bg-pink-400 transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              </div>

              {searchResults.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    {searchResults.map((result) => (
                      <div
                        key={result.url}
                        className="relative group"
                      >
                        <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                        <div
                          onClick={() => toggleUrlSelection(result.url)}
                          className={cn(
                            "cursor-pointer border-[3px] border-black p-4 transition-all relative",
                            selectedUrls.has(result.url)
                              ? "bg-lime-200"
                              : "bg-white hover:bg-gray-50"
                          )}
                        >
                          {/* Checkbox */}
                          <div className="absolute top-3 right-3">
                            <div className={cn(
                              "h-6 w-6 border-[3px] border-black flex items-center justify-center font-bold text-sm",
                              selectedUrls.has(result.url) ? "bg-lime-400" : "bg-white"
                            )}>
                              {selectedUrls.has(result.url) && "✓"}
                            </div>
                          </div>

                          <h4 className="font-bold mb-1 pr-8">{result.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-500 truncate flex-1">{result.url}</p>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="border-[2px] border-black bg-cyan-200 px-2 py-1 text-xs font-bold hover:bg-cyan-300 transition-colors"
                            >
                              Open ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSearchSubmit}
                    disabled={selectedUrls.size === 0 || isScrapingUrls}
                    className="relative w-full group"
                  >
                    <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                    <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                      {isScrapingUrls ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Scraping {selectedUrls.size} URLs...
                        </>
                      ) : (
                        <>
                          Scrape {selectedUrls.size} Selected
                          <ArrowRight className="h-6 w-6" />
                        </>
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Document Upload */}
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
              
              <div className="mb-4 border-[3px] border-dashed border-black p-12 text-center bg-orange-50">
                <Upload className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="relative inline-block">
                    <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                    <div className="relative border-[3px] border-black bg-orange-300 px-6 py-3 font-bold uppercase hover:bg-orange-400 transition-colors">
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      ) : (
                        <Upload className="h-5 w-5 inline mr-2" />
                      )}
                      {isUploading ? "Uploading..." : "Choose Files"}
                    </div>
                  </div>
                </label>
                <p className="text-sm text-gray-600 mt-4">
                  Upload PDF or DOCX files (Max 10MB each)
                </p>
              </div>

              {uploadedFiles.length > 0 && !isUploading && (
                <div className="space-y-2 mb-4">
                  <p className="font-bold text-sm uppercase">Selected Files:</p>
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 border-[2px] border-black bg-lime-100 p-3">
                      <span className="flex-1 text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="font-bold">Uploading and processing documents...</p>
                  <p className="text-sm text-gray-600">This may take a moment</p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                Note: Documents will be uploaded to Cloudflare R2 and scraped with Firecrawl.
                Make sure your R2 credentials are configured.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

