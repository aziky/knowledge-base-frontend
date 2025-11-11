import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Clock } from "lucide-react"
import { chatApi } from "@/services/api"

interface Conversation {
  conversation_id: string
  title: string
  status: "ACTIVE" | "ARCHIVED"
  created_at: string
}

interface ConversationHistoryResponse {
  conversations: Conversation[]
  total_count: number
  limit: number
  offset: number
  has_more: boolean
}

interface ConversationHistoryProps {
  projectId: string
  onConversationSelect: (conversationId: string) => void
  onNewChat: () => void
  currentConversationId: string | null
  refreshKey?: number
}

export function ConversationHistory({
  projectId,
  onConversationSelect,
  onNewChat,
  currentConversationId,
  refreshKey,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        // Adjust this API call based on your actual API structure
        const response: ConversationHistoryResponse = await chatApi.getConversations(projectId)
        console.log("Loaded conversations:", JSON.stringify(response))
        setConversations(response.conversations)
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConversations()
  }, [projectId, refreshKey])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + "..."
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.conversation_id}
                  onClick={() => onConversationSelect(conversation.conversation_id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors group hover:bg-muted ${
                    currentConversationId === conversation.conversation_id
                      ? "bg-muted"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {truncateTitle(conversation.title)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
