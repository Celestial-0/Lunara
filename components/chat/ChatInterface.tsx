"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Settings,
  Sparkles,
  Menu,
  Phone,
  MessageSquare,
  Bot,
  Zap,
  Star,
  Clock,
  Volume2,
} from "lucide-react";
import { UserProfile, AuthUser } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { AudioControls } from "./AudioControls";
import { VoiceChatWrapper } from "./VoiceChatWrapper";
import { SettingsDialog } from "./SettingsDialog";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useRealTimeMessages } from "@/lib/hooks/useRealTimeMessages";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";

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
    setTimeout(() => scrollToBottom(true), 100);
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
      });

      // Set typing indicator
      setIsTyping(true);

      // Create AI message placeholder for streaming
      const aiMessageId = `temp-ai-${Date.now()}`;
      const aiMessage = {
        id: aiMessageId,
        conversationId,
        content: "",
        role: "assistant" as const,
        createdAt: new Date(),
      };

      // Add empty AI message to UI
      updateConversationLocally(conversationId, {
        messages: [...(currentConversation?.messages || []), tempUserMessage, aiMessage],
        updatedAt: new Date(),
      });

      // Remove typing indicator since we're showing the message now
      setIsTyping(false);

      // Stream the response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      console.log('Starting to read stream...');

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream complete. Total text:', accumulatedText.length, 'chars');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('Received chunk:', chunk.substring(0, 50) + '...');

            // toTextStreamResponse() returns plain text, so just append it
            if (chunk) {
              accumulatedText += chunk;

              // Update the AI message with accumulated text
              const updatedAiMessage = {
                ...aiMessage,
                content: accumulatedText,
              };

              updateConversationLocally(conversationId, {
                messages: [...(currentConversation?.messages || []), tempUserMessage, updatedAiMessage],
                updatedAt: new Date(),
              });

              // Auto-scroll as text streams in
              scrollToBottom(true);
            }
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          throw streamError;
        } finally {
          reader.releaseLock();
        }
      }

      // Check if we got any response
      if (!accumulatedText || accumulatedText.trim().length === 0) {
        throw new Error('Received empty response from AI');
      }

      // Refresh in background to sync with database (don't await)
      forceRefresh().catch(err => console.error('Background refresh failed:', err));
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
    return <Phone className="h-4 w-4" />;
  };

  const getVoiceChatStatus = () => {
    if (voiceChat.isListening) return "Listening";
    if (voiceChat.isSpeaking) return "Speaking";
    if (voiceChat.isConnected) return "Ready";
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4 animate-spin" />
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Loading conversation...
              </h3>
              <p className="text-muted-foreground text-sm">
                Setting up your chat experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Mobile Menu Toggle */}
              {isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleSidebar}
                      className="h-10 w-10 p-0"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle sidebar</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* AI Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage
                    src="https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Lunara%20AI%20Icon.PNG"
                    alt="Lunara AI"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
              </div>

              {/* Title and Status */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-primary">
                    Lunara
                  </h1>
                  <div className="flex items-center gap-2">
                    {isPolling && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 ">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Live
                      </Badge>
                    )}
                    {voiceChat.isConnected && (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">
                        <Volume2 className="w-3 h-3 mr-1" />
                        {getVoiceChatStatus() || "Voice"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4 text-primary/60" />
                  <span>Your AI Companion</span>
                  {isPolling && (
                    <span className="hidden sm:flex items-center ml-2 text-green-600">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1" />
                      Real-time updates
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Desktop Audio Controls */}
              <div className="hidden md:block">
                <AudioControls />
              </div>

              {/* Voice Chat Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={voiceChat.isConnected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-10 w-10 p-0 relative transition-all duration-200",
                      voiceChat.isConnected
                        ? "bg-green-500 hover:bg-green-600"
                        : "hover:bg-muted"
                    )}
                    onClick={handleVoiceChatToggle}
                  >
                    {getVoiceChatIcon()}
                    {voiceChat.isConnecting && (
                      <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-md animate-spin" />
                    )}
                    {voiceChat.isListening && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                    {voiceChat.isSpeaking && (
                      <div className="absolute -bottom-1 -left-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{voiceChat.isConnected ? "End voice chat" : "Start voice chat"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Settings Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-muted transition-colors"
                    onClick={handleSettingsClick}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        {/* Messages Area */}
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 max-w-4xl mx-auto">
              <div className="space-y-6">
                {/* Welcome Screen */}
                {(!currentConversation ||
                  !currentConversation.messages ||
                  currentConversation.messages.length === 0) &&
                  !isTyping && (
                    <div className="text-center py-8 px-4">
                      <Card className="mx-auto max-w-md border-0">
                        <CardHeader className="text-center pb-4">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary/10 border border-primary/20">
                            <Sparkles className="w-8 h-8 text-primary" />
                          </div>

                          <h2 className="text-2xl font-bold mb-2 text-primary">
                            Welcome to Lunara!
                          </h2>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            Your intelligent AI companion, ready to help with anything you need.
                          </p>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {/* Voice Chat Quick Start */}
                          <div className="mb-6">
                            <Button
                              onClick={() => setShowVoiceChat(true)}
                              variant="outline"
                              size="sm"
                              className="w-full h-10 bg-blue-500/10 border-blue-200 hover:bg-blue-500/20 transition-all duration-200"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Try Voice Chat
                              <Zap className="w-3 h-3 ml-2 text-yellow-500" />
                            </Button>
                          </div>

                          {/* Conversation Starters */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              Quick starters
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { text: "Plan my day", icon: Clock },
                                { text: "Explain topics", icon: Zap },
                                { text: "Write stories", icon: Star },
                                { text: "Solve problems", icon: Bot },
                              ].map((suggestion) => (
                                <button
                                  key={suggestion.text}
                                  onClick={() => {
                                    setMessage(suggestion.text);
                                    scrollToBottom(true);
                                  }}
                                  className="group p-3 text-xs rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 text-left bg-background transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                  <div className="flex items-center gap-2">
                                    <suggestion.icon className="w-3 h-3 text-primary/70 group-hover:text-primary flex-shrink-0 transition-colors" />
                                    <span className="font-medium truncate">{suggestion.text}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                {/* Message List */}
                {currentConversation?.messages?.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMobile={isMobile}
                    userAvatar={getUserAvatar()}
                    userInitials={getUserInitials()}
                  />
                ))}

                {/* Typing Indicator */}
                {isTyping && <TypingIndicator isMobile={isMobile} />}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t bg-card/80 backdrop-blur-sm">
          {/* Mobile Audio Controls Bar */}
          {/* <div className="flex justify-center py-2 md:hidden border-b border-border/50 bg-muted/20">
            <AudioControls isMobile={true} />
          </div> */}

          <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-end gap-3 md:gap-4">
              {/* Message Input */}
              <div className="flex-1 relative">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (!message && e.target.value) {
                        userStartedTyping.current = true;
                        setTimeout(() => {
                          userStartedTyping.current = false;
                        }, 500);
                        scrollToBottom(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className={cn(
                      "h-12 md:h-14 pr-12 md:pr-14 text-base rounded-2xl md:rounded-3xl",
                      "border-2 focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
                      "disabled:opacity-50 transition-all duration-200",
                      "bg-background/80 backdrop-blur-sm"
                    )}
                    disabled={isTyping || isSending}
                  />
                  {/* Voice Recording Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 p-0 rounded-full hover:bg-muted"
                        onClick={toggleRecording}
                        disabled={isTyping || isSending}
                      >
                        {isRecording ? (
                          <MicOff className="h-4 w-4 md:h-5 md:w-5 text-destructive animate-pulse" />
                        ) : (
                          <Mic className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isRecording ? "Stop recording" : "Start voice recording"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Send Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping || isSending}
                    size="sm"
                    className={cn(
                      "h-12 w-12 md:h-14 md:w-14 p-0 rounded-2xl md:rounded-3xl",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:opacity-50 shadow-lg transition-all duration-200",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    {isSending ? (
                      <div className="h-5 w-5 md:h-6 md:w-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <VoiceChatWrapper
          isOpen={showVoiceChat}
          onClose={() => setShowVoiceChat(false)}
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
    </TooltipProvider>
  );
}
