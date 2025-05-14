"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Import only the icons that are actually used
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ProviderSelector } from "@/components/provider-selector"

interface Model {
  id: string
  name: string
}

interface GroupedModels {
  provider: {
    id: string;
    name: string;
    description: string;
    isLocal: boolean;
    examples?: string[];
    company?: string; // Optional, present for OpenRouter company groups
  };
  models: { id: string; name: string }[];
}

interface WelcomeViewProps {
  prompt: string
  setPrompt: (value: string) => void
  selectedModel: string
  setSelectedModel: (value: string) => void
  selectedProvider: string
  setSelectedProvider: (value: string) => void
  selectedSystemPrompt: string
  setSelectedSystemPrompt: (value: string) => void
  customSystemPrompt: string
  setCustomSystemPrompt: (value: string) => void
  maxTokens: number | undefined
  setMaxTokens: (value: number | undefined) => void
  onGenerate: () => void
}

export function WelcomeView({
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  selectedProvider,
  setSelectedProvider,
  selectedSystemPrompt,
  setSelectedSystemPrompt,
  customSystemPrompt,
  setCustomSystemPrompt,
  maxTokens,
  setMaxTokens,
  onGenerate
}: WelcomeViewProps) {
  const [titleClass, setTitleClass] = useState("pre-animation")
  const [groupedModels, setGroupedModels] = useState<GroupedModels[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [selectedOpenRouterCompany, setSelectedOpenRouterCompany] = useState<string>("")

  useEffect(() => {
    // Add typing animation class after component mounts
    const timer = setTimeout(() => {
      setTitleClass("typing-animation")
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Fetch all models grouped by provider
    const fetchGroupedModels = async () => {
      setIsLoadingModels(true)

      try {
        const response = await fetch("/api/get-models/all")
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "Error fetching models")

        setGroupedModels(data)
      } catch (error) {
        setGroupedModels([])
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchGroupedModels()
  }, [])

  // Find OpenRouter company groups and other providers
  const openRouterGroups = groupedModels.filter(g => g.provider.id === "openrouter");
  const otherGroups = groupedModels.filter(g => g.provider.id !== "openrouter");
  const openRouterCompanies = openRouterGroups.map(g => g.provider.company || g.provider.name);

  // Find the selected OpenRouter group
  const selectedOpenRouterGroup = openRouterGroups.find(g => (g.provider.company || g.provider.name) === selectedOpenRouterCompany) || openRouterGroups[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0 animate-pulse-slow"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        <h1
          className={`text-4xl md:text-6xl font-bold tracking-wider text-white mb-12 ${titleClass}`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          WHAT ARE WE BUILDING?
        </h1>

        <div className="relative w-full mb-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the website you want to create..."
            className="min-h-[150px] w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 pr-[120px] transition-all duration-300"
          />
          <Button
            onClick={onGenerate}
            disabled={!prompt.trim() || !selectedModel}
            className="absolute bottom-4 right-4 bg-gray-900/90 hover:bg-gray-800 text-white font-medium tracking-wider py-3 px-12 text-base rounded-md transition-all duration-300 border border-gray-800 hover:border-gray-700 focus:border-white focus:ring-white"
          >
            GENERATE
          </Button>
        </div>

        <ProviderSelector
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          onProviderChange={() => {}}
        />

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">SELECT MODEL</label>
          {isLoadingModels ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span className="text-gray-400">Loading models...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* OpenRouter company dropdown */}
              {openRouterGroups.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-400 mb-1">OpenRouter Company</label>
                  <Select
                    value={selectedOpenRouterCompany || openRouterCompanies[0] || ""}
                    onValueChange={setSelectedOpenRouterCompany}
                  >
                    <SelectTrigger className="w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white">
                      <SelectValue placeholder="Choose a company..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white">
                      {openRouterCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Show selected OpenRouter company models */}
              {openRouterGroups.length > 0 && selectedOpenRouterGroup && (
                <div key={selectedOpenRouterGroup.provider.company || selectedOpenRouterGroup.provider.name} className="">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-white">{selectedOpenRouterGroup.provider.name}</span>
                    <span className="text-xs text-gray-400">{selectedOpenRouterGroup.provider.description}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedOpenRouterGroup.models.length > 0 ? (
                      selectedOpenRouterGroup.models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setSelectedProvider(selectedOpenRouterGroup.provider.id)
                          }}
                          className={`w-full text-left rounded-lg border border-gray-800 bg-gray-900/80 px-4 py-3 transition-all duration-200 hover:border-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white text-white ${selectedModel === model.id && selectedProvider === selectedOpenRouterGroup.provider.id ? 'border-blue-500 bg-gray-800' : ''}`}
                        >
                          <div className="font-medium text-base">{model.name}</div>
                          <div className="text-xs text-gray-400 break-all">{model.id}</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">No models available</div>
                    )}
                  </div>
                </div>
              )}
              {/* Show other providers as before */}
              {otherGroups.length > 0 && otherGroups.map((group) => (
                <div key={group.provider.id} className="">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-white">{group.provider.name}</span>
                    <span className="text-xs text-gray-400">{group.provider.description}</span>
                    {group.provider.examples && group.provider.examples.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {group.provider.examples.map((ex, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{ex}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.models.length > 0 ? (
                      group.models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setSelectedProvider(group.provider.id)
                          }}
                          className={`w-full text-left rounded-lg border border-gray-800 bg-gray-900/80 px-4 py-3 transition-all duration-200 hover:border-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white text-white ${selectedModel === model.id && selectedProvider === group.provider.id ? 'border-blue-500 bg-gray-800' : ''}`}
                        >
                          <div className="font-medium text-base">{model.name}</div>
                          <div className="text-xs text-gray-400 break-all">{model.id}</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">No models available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">SYSTEM PROMPTS</label>
          <Select value={selectedSystemPrompt} onValueChange={setSelectedSystemPrompt}>
            <SelectTrigger className="w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white">
              <SelectValue placeholder="Choose a system prompt..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="default">
                <div className="flex flex-col">
                  <span>Default</span>
                  <span className="text-xs text-gray-400">Standard code generation</span>
                </div>
              </SelectItem>
              <SelectItem value="thinking">
                <div className="flex flex-col">
                  <span>Thinking</span>
                  <span className="text-xs text-gray-400">Makes non thinking models think</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex flex-col">
                  <span>Custom System Prompt</span>
                  <span className="text-xs text-gray-400">Specify a custom System Prompt</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedSystemPrompt === 'custom' && (
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">CUSTOM SYSTEM PROMPT</label>
            <Textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Enter a custom system prompt to override the default..."
              className="min-h-[100px] w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 transition-all duration-300"
            />
            <p className="mt-1 text-xs text-gray-400">
              Your custom prompt will be used for this generation and subsequent regenerations.
            </p>
          </div>
        )}

        <div className="w-full mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">MAX OUTPUT TOKENS</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={maxTokens || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                setMaxTokens(value && !isNaN(value) && value > 0 ? value : undefined);
              }}
              placeholder="Default (model dependent)"
              className="w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 transition-all duration-300"
              min="100"
              step="100"
            />
            <Button
              variant="outline"
              onClick={() => setMaxTokens(undefined)}
              className="border-gray-800 hover:bg-gray-800 text-gray-300"
            >
              Reset
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Set the maximum number of tokens for the model output. Higher values allow for longer code generation but may take more time. Leave empty to use the model's default.
          </p>
        </div>


      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        .pre-animation {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          border-right: 4px solid transparent;
        }

        .typing-animation {
          overflow: hidden;
          white-space: nowrap;
          border-right: 4px solid #fff;
          animation:
            typing 1.75s steps(40, end),
            blink-caret 0.75s step-end infinite;
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #fff }
        }
      `}</style>
    </div>
  )
}
