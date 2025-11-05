import { useState, useEffect, useMemo } from "react"
import { ChatPanel } from "./chat-panel"
import { ConversationHistory } from "./conversation-history"
import { chatApi } from "@/services/api"

interface FileItem {
  id: string
  name: string
  icon: string
  type?: "document" | "video"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatWithHistoryProps {
  projectId: string
  selectedFiles: FileItem[]
}

export function ChatWithHistory({ projectId, selectedFiles }: ChatWithHistoryProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (currentConversationId) {
        setIsLoadingMessages(true)
        try {
          const data = await chatApi.getConversationMessages(currentConversationId)
          // Transform the messages from API format to our format
          interface ApiMessage {
            id: string;
            sender_type: "USER" | "BOT";
            content: string;
            created_at: string;
            metadata?: Record<string, unknown>;
          }
          // Handle the nested structure: data.messages contains the array
          const messagesArray = data.messages || []
          const messages: Message[] = messagesArray.map((msg: ApiMessage) => ({
            id: msg.id,
            role: msg.sender_type === 'USER' ? 'user' : 'assistant',
            content: msg.content,
          }))
          setConversationMessages(messages)
        } catch (error) {
          console.error("Error loading conversation messages:", error)
          setConversationMessages([])
        } finally {
          setIsLoadingMessages(false)
        }
      } else {
        setConversationMessages([])
      }
    }
    
    loadMessages()
  }, [currentConversationId])

  const handleConversationSelect = async (conversationId: string) => {
    setCurrentConversationId(conversationId)
  }

  const handleNewChat = () => {
    setCurrentConversationId(null)
    setConversationMessages([])
  }

  const handleConversationStart = (conversationId: string) => {
    // When a new conversation is created, update the current conversation ID
    setCurrentConversationId(conversationId)
    // Refresh the conversation history to show the new conversation
    setRefreshKey(prev => prev + 1)
  }

  const handleBackToConversations = () => {
    // Clear the current conversation and messages
    setCurrentConversationId(null)
    setConversationMessages([])
  }

  // Stringify messages for stable key
  const messagesKey = useMemo(() => 
    JSON.stringify(conversationMessages.map(m => m.id)), 
    [conversationMessages]
  )

  return (
    <div className="flex h-screen">
      {/* Conversation History Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationHistory
          projectId={projectId}
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
          currentConversationId={currentConversationId}
          refreshKey={refreshKey}
        />
      </div>

      {/* Chat Panel */}
      <div className="flex-1">
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        ) : (
          <ChatPanel 
            key={`${currentConversationId}-${messagesKey}`}
            projectId={projectId} 
            selectedFiles={selectedFiles}
            conversationId={currentConversationId}
            initialMessages={conversationMessages}
            onConversationStart={handleConversationStart}
            onBackToConversations={handleBackToConversations}
          />
        )}
      </div>
    </div>
  )
}
