"use client"

import { useState, useEffect, useRef } from "react"
import {
  Terminal, Send, Bot, Zap, Loader2,
  Sparkles, History, Info, Play, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Agent {
  id: string
  name: string
  color: string
}

interface Skill {
  id: string
  name: string
  agentId: string
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  durationMs?: number
  cost?: number
  timestamp: Date
}

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [selectedSkillId, setSelectedSkillId] = useState<string>("none")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, skillsRes] = await Promise.all([
          fetch("/api/admin/orchestrator/agents"),
          fetch("/api/admin/orchestrator/skills")
        ])

        if (agentsRes.ok) {
          const data = await agentsRes.json()
          const agentList = data.agents || []
          setAgents(agentList)
          if (agentList.length > 0) setSelectedAgentId(agentList[0].id)
        }

        if (skillsRes.ok) {
          const data = await skillsRes.json()
          setSkills(data.skills || [])
        }
      } catch (error) {
        console.error("Error fetching playground data:", error)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !selectedAgentId || loading) return

    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/orchestrator/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          skillId: selectedSkillId === "none" ? undefined : selectedSkillId,
          input: input
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMsg: Message = {
          role: "assistant",
          content: data.result,
          durationMs: data.durationMs,
          cost: data.cost,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        const err = await response.json()
        setMessages(prev => [...prev, {
          role: "system",
          content: `Error: ${err.error || "Execution failed"}`,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "system",
        content: "Network error occurred",
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)
  const availableSkills = skills.filter(s => s.agentId === selectedAgentId)

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 h-full bg-black">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-neutral-500">Initialisation du Playground...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-black">
      {/* Sidebar Settings */}
      <div className="w-80 border-r border-neutral-800 p-6 flex flex-col gap-6 bg-neutral-900/30">
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4" /> Agent
          </h3>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Choisir un agent" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id} className="text-white">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Compétence
          </h3>
          <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Skill optionnel" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="none" className="text-neutral-400 italic">Aucune (Raw Prompt)</SelectItem>
              {availableSkills.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-white">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-neutral-500 mt-2">
            Si une skill est sélectionnée, l'input sera injecté dans son template.
          </p>
        </div>

        <div className="mt-auto border-t border-neutral-800 pt-6">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-2">
              <Info className="w-4 h-4" /> Playground Info
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Le Playground vous permet d'interagir directement avec vos agents pour affiner leurs prompts système et leurs outils avant la mise en production.
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 text-xs"
            onClick={() => setMessages([])}
          >
            <Trash2 className="w-3 h-3 mr-2" /> Effacer l'historique
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Terminal className="w-12 h-12 mb-4 text-purple-500" />
                <h2 className="text-xl font-bold text-white mb-2">Prêt pour le test</h2>
                <p className="text-sm text-neutral-500 max-w-sm">
                  Sélectionnez un agent et envoyez un message pour commencer le débogage en direct.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn(
                "flex flex-col",
                m.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed prose prose-invert prose-neutral",
                  m.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-none"
                    : m.role === "system"
                      ? "bg-red-500/10 border border-red-500/20 text-red-400 font-mono"
                      : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700"
                )}>
                  {m.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-1 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 text-white border-b border-neutral-700 pb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 text-white">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic my-4 text-neutral-400">{children}</blockquote>,
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4 rounded-lg border border-neutral-700">
                            <table className="w-full text-xs text-left border-collapse">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] font-bold">{children}</thead>,
                        th: ({ children }) => <th className="p-2 border-b border-neutral-700">{children}</th>,
                        td: ({ children }) => <td className="p-2 border-b border-neutral-700/50">{children}</td>
                      }}
                    >
                          {m.content}
                        </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === "assistant" && (
                  <div className="flex items-center gap-3 mt-2 px-2">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {m.durationMs}ms
                    </span>
                    <span className="text-[10px] text-cyan-500/70 font-mono">
                      ${m.cost?.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-xs text-neutral-500 italic">Agent réfléchit...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 bg-neutral-900/50 border-t border-neutral-800">
          <div className="max-w-3xl mx-auto relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Tester ${selectedAgent?.name || 'l\'agent'}...`}
              className="pr-16 bg-neutral-800 border-neutral-700 text-white min-h-[60px] max-h-[200px] resize-none focus:ring-purple-500"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-purple-500 hover:bg-purple-600 w-10 h-10 shadow-lg shadow-purple-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-neutral-600 mt-3">
            SHIFT + ENTER pour une nouvelle ligne. Les messages sont enregistrés dans l'Observabilité.
          </p>
        </div>
      </div>
    </div>
  )
}
