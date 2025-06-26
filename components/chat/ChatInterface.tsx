"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Settings,
  Sparkles,
  Menu,
  Phone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { UserProfile, AuthUser } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { AudioControls } from "./AudioControls";
import { VoiceChat } from "./VoiceChat";
import { SettingsDialog } from "./SettingsDialog";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useRealTimeMessages } from "@/lib/hooks/useRealTimeMessages";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

export function ChatInterface({
  isMobile = false,
  onToggleSidebar,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const user = session?.user as AuthUser;
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyDialogData, setApiKeyDialogData] = useState({ messageCount: 0, limit: 15 });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    currentConversation,
    isTyping,
    setIsTyping,
    createConversation,
    isLoading,
    updateConversationLocally,
  } = useChatStore();
  // Real-time message polling
  const { isPolling, forceRefresh } = useRealTimeMessages(
    currentConversation?.id || null
  );

  // Voice chat integration
  const voiceChat = useVoiceChat();
  // Load user profile for avatar
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    try {
      const profile = await apiClient.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  // Track when user starts typing for auto-scroll
  const userStartedTyping = useRef(false);

  // Smart auto-scroll: only scroll if user is near bottom
  const scrollToBottom = (force = false) => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (force || isNearBottom || userStartedTyping.current) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }
  };

  // Auto-scroll when typing indicator changes
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isTyping]);

  // Auto-scroll when component mounts or conversation changes
  useEffect(() => {
    // Short delay to ensure the DOM is fully rendered
    setTimeout(() => scrollToBottom(true), 200);
  }, [currentConversation?.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const userMessage = message.trim();
    setMessage("");
    setIsSending(true);

    // Force scroll to bottom when sending message
    scrollToBottom(true);

    try {
      let conversationId = currentConversation?.id;

      // Create new conversation if none exists
      if (!conversationId) {
        const newConversation = await createConversation();
        conversationId = newConversation.id;
      }

      // Add user message locally first for immediate UI update
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        conversationId,
        content: userMessage,
        role: "user" as const,
        createdAt: new Date(),
      };

      // Update UI immediately with optimistic update
      updateConversationLocally(conversationId, {
        messages: [...(currentConversation?.messages || []), tempUserMessage],
        updatedAt: new Date(),
      });      // Set typing indicator
      setIsTyping(true); 
      
      // Send to backend
      const chatResponse = await apiClient.sendChatMessage(conversationId, userMessage);

      // Remove typing indicator
      setIsTyping(false);

      // Update conversation title if it was generated
      if (chatResponse.title && currentConversation && 
          (!currentConversation.title || currentConversation.title === "New Conversation")) {
        updateConversationLocally(conversationId, {
          title: chatResponse.title,
        });
      }

      // Force refresh to get the real messages from backend
      await forceRefresh();
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsTyping(false);

      // Check if it's the free limit reached error
      interface ApiError {
        error: string;
        message: string;
        messageCount?: number;
        limit?: number;
      }

      // Handle API client error responses
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = error as ApiError;
        if (apiError.error === 'FREE_LIMIT_REACHED') {
          setApiKeyDialogData({
            messageCount: apiError.messageCount || 15,
            limit: apiError.limit || 15
          });
          setShowApiKeyDialog(true);
          return;
        }
      }

      // Add error message locally for other errors
      if (currentConversation?.id) {
        const errorMessage = {
          id: `error-${Date.now()}`,
          conversationId: currentConversation.id,
          content:
            "I'm sorry, I'm having trouble responding right now. Please try again.",
          role: "assistant" as const,
          createdAt: new Date(),
        };

        updateConversationLocally(currentConversation.id, {
          messages: [...(currentConversation.messages || []), errorMessage],
          updatedAt: new Date(),
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };
  const handleVoiceChatToggle = () => {
    if (voiceChat.isConnected) {
      voiceChat.endVoiceChat();
      setShowVoiceChat(false);
    } else {
      setShowVoiceChat(!showVoiceChat);
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };
  const getUserAvatar = () => {
    // Priority: profile avatar > session image > fallback
    return userProfile?.avatar || user?.image || "";
  };
  const getUserInitials = () => {
    const name = user?.name || user?.email || "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getVoiceChatIcon = () => {
    if (voiceChat.isConnected) {
      return voiceChat.connectionQuality === "good" ? (
        <Wifi className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
      );
    }
    return <Phone className="h-3 w-3 md:h-4 md:w-4" />;
  };

  const getVoiceChatStatus = () => {
    if (voiceChat.isListening) return "Listening";
    if (voiceChat.isSpeaking) return "Speaking";
    if (voiceChat.isConnected) return "Ready";
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {" "}
      {/* Enhanced Header with Real-time Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 flex items-center justify-between p-3 md:p-4 lg:p-6 border-b bg-background/80 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 min-w-0 flex-1">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl flex-shrink-0"
            >
              <Menu className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative flex-shrink-0"
          >
            <Avatar
              className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 border-2"
              style={{
                borderColor: `oklch(from var(--primary) l c h / 0.2)`,
              }}
            >
              <AvatarImage src="https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Lunara%20AI%20Icon.PNG" />
              <AvatarFallback
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`,
                }}
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-primary" />
              </AvatarFallback>
            </Avatar>{" "}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full border-2 border-background bg-green-500"
            />
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm md:text-lg lg:text-xl font-semibold truncate">
                Lunara
              </h2>
              {isPolling && (
                <Badge variant="secondary" className="text-xs">
                  Live
                </Badge>
              )}
              {voiceChat.isConnected && (
                <Badge variant="outline" className="text-xs">
                  {getVoiceChatStatus() || "Voice Active"}
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your AI Companion
              {isPolling && (
                <span className="ml-2 text-green-500">• Real-time updates</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          <div className="hidden sm:block">
            <AudioControls />
          </div>

          {/* Voice Chat Toggle */}
          <Button
            variant={voiceChat.isConnected ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 md:h-9 md:w-9 rounded-xl relative",
              voiceChat.isConnected && "bg-green-500 hover:bg-green-600"
            )}
            onClick={handleVoiceChatToggle}
          >
            {getVoiceChatIcon()}
            {voiceChat.isConnecting && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-primary border-t-transparent rounded-xl"
              />
            )}
            {/* Activity indicators */}
            {voiceChat.isListening && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-background"
              />
            )}
            {voiceChat.isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-background"
              />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9 rounded-xl"
            onClick={handleSettingsClick}
          >
            <Settings className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </motion.div>
      {/* Messages with Enhanced Mobile Layout */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-3 md:p-4 lg:p-6">
            <div className="space-y-3 md:space-y-4 lg:space-y-6 max-w-4xl mx-auto">
              {/* Welcome message for new conversations */}
              {(!currentConversation ||
                !currentConversation.messages ||
                currentConversation.messages.length === 0) &&
                !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8 md:py-12"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 bg-gradient-to-tr from-primary to-primary/60"
                    >
                      <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      Welcome to Lunara!
                    </h3>
                    <p className="text-muted-foreground mb-4 md:mb-6 max-w-md mx-auto text-sm md:text-base">
                      I&apos;m your AI companion, ready to help with anything
                      you need. Start a conversation by typing a message below
                      or try voice chat!
                    </p>

                    {/* Voice Chat Promotion */}
                    <div className="mb-4 md:mb-6 space-y-2">
                      <Button
                        onClick={() => setShowVoiceChat(true)}
                        variant="outline"
                        className="rounded-xl mr-2"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Try Voice Chat
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Speak naturally and I&apos;ll respond with voice!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 max-w-lg mx-auto">
                      {[
                        "Help me plan my day",
                        "Explain quantum computing",
                        "Write a creative story",
                        "Solve a math problem",
                      ].map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          onClick={() => {
                            setMessage(suggestion);
                            // Force scroll to bottom when selecting a suggestion
                            scrollToBottom(true);
                          }}
                          className="p-2 md:p-3 text-xs md:text-sm rounded-xl border border-border hover:border-primary/50 transition-colors text-left"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

              <AnimatePresence mode="popLayout">
                {currentConversation?.messages?.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMobile={isMobile}
                    userAvatar={getUserAvatar()}
                    userInitials={getUserInitials()}
                  />
                ))}
              </AnimatePresence>
              {isTyping && <TypingIndicator isMobile={isMobile} />}
            </div>
          </div>
        </ScrollArea>
      </div>
      {/* Enhanced Mobile Input */}{" "}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 p-3 md:p-4 lg:p-6 border-t bg-background/80 backdrop-blur-sm pb-safe"
      >
        <div className="max-w-4xl mx-auto">
          {/* Mobile Audio Controls */}
          <div className="flex justify-center mb-2 md:mb-3 sm:hidden">
            <AudioControls />
          </div>

          <div className="flex items-end space-x-2 md:space-x-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Set flag and trigger scroll only when user starts typing in an empty field
                  if (!message && e.target.value) {
                    userStartedTyping.current = true;
                    // Reset the flag after a short delay
                    setTimeout(() => {
                      userStartedTyping.current = false;
                    }, 500);
                    // Force scroll to bottom when user starts typing
                    scrollToBottom(true);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className={cn(
                  "h-10 md:h-12 lg:h-14 rounded-xl md:rounded-2xl pr-10 md:pr-12 lg:pr-14 text-sm md:text-base resize-none border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
                  "min-h-[40px] md:min-h-[48px] lg:min-h-[56px]"
                )}
                disabled={isTyping || isSending}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 rounded-lg md:rounded-xl"
                onClick={toggleRecording}
              >
                <motion.div
                  animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: isRecording ? Infinity : 0,
                  }}
                >
                  {isRecording ? (
                    <MicOff className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                  ) : (
                    <Mic className="h-3 w-3 md:h-4 md:w-4" />
                  )}
                </motion.div>
              </Button>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping || isSending}
                size="icon"
                className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-xl md:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
              >
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>{" "}
      {/* Voice Chat Component */}
      <VoiceChat
        isOpen={showVoiceChat}
        onClose={() => setShowVoiceChat(false)}
        onToggle={() => setShowVoiceChat(!showVoiceChat)}
        voiceChatState={voiceChat}
      />
      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      
      {/* API Key Dialog */}
      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSuccess={() => {
          setShowApiKeyDialog(false);
          // Optionally refresh the UI or show a success message
        }}
        messageCount={apiKeyDialogData.messageCount}
        freeLimit={apiKeyDialogData.limit}
      />
    </div>
  );
}
