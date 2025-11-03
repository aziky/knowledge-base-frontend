import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ArrowUp, X } from "lucide-react"
import { chatApi } from "@/services/api"

interface FileItem {
  id: string
  name: string
  icon: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  projectId: string;
  selectedFiles: FileItem[];
}

export function ChatPanel({ projectId, selectedFiles }: ChatPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextPopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextPopoverRef.current && !contextPopoverRef.current.contains(event.target as Node)) {
        setIsContextOpen(false)
      }
    }

    if (isContextOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isContextOpen])

  const filteredFiles = selectedFiles.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const selectedFileNames = selectedFiles.filter((f) => selectedFileIds.includes(f.id)).map((f) => f.name)

  // Function to format markdown-like text for display
  const formatAnswerText = (text: string): string => {
    if (!text) return text;
    
    return text
      // Convert **bold** to HTML bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert bullet points (* text) to proper list items
      .replace(/^\*\s+(.*)$/gm, '• $1')
      // Convert newlines to proper line breaks
      .replace(/\n/g, '<br>')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || selectedFileIds.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Prepare API payload
    const payload = {
      project_id: projectId,
      document_ids: selectedFileIds,
      question: input,
    }

    try {
      const data = await chatApi.ask(payload);
      // Assume response contains { answer: string }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formatAnswerText(data.answer || "No answer returned."),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error contacting chat service:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Error contacting chat service.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background max-w-4xl mx-auto">

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-2xl mx-auto space-y-4 min-h-full">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center min-h-[400px]">
                  <p className="text-muted-foreground text-sm">Select files and ask your questions</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-lg rounded-lg px-4 py-3 text-sm ${message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground border border-border"
                          }`}
                      >
                        <div 
                          className="whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border p-6 bg-card">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Selected Files Row (now above input) */}
          {selectedFileIds.length > 0 && (
            <div className="px-4 mb-2">
              <span className="font-semibold text-xs mb-1 block">
                {selectedFileIds.length} file{selectedFileIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="w-full">
                <div className="flex flex-wrap gap-2">
                  {selectedFileNames.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-1 rounded bg-muted text-xs font-mono text-black border border-border flex items-center whitespace-pre-line break-all"
                      style={{ wordBreak: "break-all", maxWidth: "100%" }}
                    >
                      {name}
                    </span>
                  ))}
                  <button
                    onClick={() => setSelectedFileIds([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline ml-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="flex gap-3 relative">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, search, or make anything..."
                disabled={isLoading || selectedFileIds.length === 0}
                className="flex-1 bg-secondary border-secondary text-sm pr-32"
              />

              <button
                type="button"
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm">@</span>
                <span>Add context</span>
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || selectedFileIds.length === 0 || !input.trim()}
              size="icon"
              className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>

            {isContextOpen && (
              <div
                ref={contextPopoverRef}
                className="absolute bottom-full mb-2 right-0 w-96 bg-card border border-border rounded-lg shadow-lg z-50"
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Add Context Files
                  </h3>
                  <button
                    onClick={() => setIsContextOpen(false)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-secondary text-sm"
                    />
                  </div>
                </div>

                {/* Files List */}
                <ScrollArea className="max-h-64 p-4">
                  <div className="space-y-1">
                    {filteredFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => toggleFileSelection(file.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${selectedFileIds.includes(file.id)
                            ? "bg-muted text-foreground"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <span className="text-lg flex-shrink-0">{file.icon}</span>
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
