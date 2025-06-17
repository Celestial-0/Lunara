"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Download,
  Star,
  Archive,
  Filter,
  Loader2,
  Check,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Conversation, SearchResults } from "@/types/types";

interface ConversationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationManager({
  open,
  onOpenChange,
}: ConversationManagerProps) {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    deleteConversation,
    updateConversation,
    refreshConversations,
    createConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>(
    []
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const handleRefresh = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setIsRefreshing(true);
        }
        await refreshConversations();
        setLastRefresh(Date.now());
      } catch (error) {
        console.error("Failed to refresh conversations:", error);
      } finally {
        if (showLoading) {
          setIsRefreshing(false);
        }
      }
    },
    [refreshConversations]
  );

  // Load conversations when dialog opens
  useEffect(() => {
    if (open) {
      handleRefresh();
    }
  }, [open, handleRefresh]);

  // Auto-refresh every 30 seconds when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      handleRefresh(false); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [open, handleRefresh]);

  // Search functionality with debouncing
  useEffect(() => {
    const searchConversations = async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await apiClient.search(searchQuery, "conversations");
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults(null);
        }
      } else {
        setSearchResults(null);
      }
    };

    const debounceTimer = setTimeout(searchConversations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCreateConversation = async () => {
    try {
      setIsCreating(true);
      const newConversation = await createConversation("New Conversation");
      await handleRefresh(false);
      // Auto-select the new conversation
      setCurrentConversation(newConversation);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to get conversation title
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title && conversation.title.trim()) {
      return conversation.title;
    }
    return "New Conversation";
  };

  const filteredConversations = searchResults
    ? searchResults.conversations
        .map((result) => conversations.find((conv) => conv.id === result.id))
        .filter(Boolean)
    : conversations.filter((conv) => {
        const title = getConversationTitle(conv);
        return (
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages?.some((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      });

  const handleSelectConversation = (id: string) => {
    setSelectedConversations((prev) =>
      prev.includes(id) ? prev.filter((convId) => convId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(
        filteredConversations
          .map((conv) => conv?.id)
          .filter((id): id is string => typeof id === "string")
      );
    }
  };

  const handleEditTitle = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(getConversationTitle(conversation));
  };

  const handleSaveTitle = async () => {
    if (!editingId) return;

    try {
      const newTitle = editTitle.trim() || "New Conversation";
      await updateConversation(editingId, { title: newTitle });
      setEditingId(null);
      setEditTitle("");
      // Refresh to get updated data
      await handleRefresh(false);
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDeleteSelected = async () => {
    if (selectedConversations.length === 0) return;

    try {
      setIsLoading(true);
      await Promise.all(
        selectedConversations.map((id) => deleteConversation(id))
      );
      setSelectedConversations([]);
      // Refresh to get updated list
      await handleRefresh(false);
    } catch (error) {
      console.error("Failed to delete conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSelected = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.exportData("json", "conversations");

      interface ExportData {
        conversations: { id: string; [key: string]: unknown }[];
        [key: string]: unknown;
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "conversations" in data
      ) {
        const typedData = data as ExportData;

        // Filter to only selected conversations if any are selected
        const exportData =
          selectedConversations.length > 0
            ? {
                ...typedData,
                conversations: typedData.conversations.filter((conv) =>
                  selectedConversations.includes(conv.id)
                ),
              }
            : typedData;

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Lunara-conversations-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveSelected = () => {
    // TODO: Implement archive functionality when backend supports it
    console.log("Archive functionality not yet implemented");
    setSelectedConversations([]);
  };

  const handleConversationClick = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    onOpenChange(false);
  };

  const formatRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatCount = (count: number) => {
    if (count > 999) return "999+";
    return count.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden sm:rounded-xl md:w-[90vw] lg:w-[80vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Conversation Manager</span>
              <Badge variant="secondary" className="text-xs">
                {conversations.length} total
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Last updated: {formatRelativeTime(new Date(lastRefresh))}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRefresh()}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage, search, and organize your conversations with Lunara
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex flex-col h-full max-h-[calc(85vh-10rem)]">
          {" "}
          {/* Search and Actions */}{" "}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              {" "}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg focus:border-primary focus-visible:ring-0 focus-visible:ring-primary"
              />
            </div>{" "}
            <Button
              variant="outline"
              onClick={handleCreateConversation}
              disabled={isCreating}
              className="rounded-lg"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              New
            </Button>
            <Button variant="outline" size="icon" className="rounded-lg">
              <Filter className="w-4 h-4" />
            </Button>
          </div>{" "}
          {/* Bulk Actions */}
          {selectedConversations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 border bg-primary/5 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedConversations.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedConversations.length === filteredConversations.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArchiveSelected}
                  disabled={isLoading}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-destructive"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
          {/* Conversations List */}{" "}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4 p-2">
                {" "}
                {isRefreshing && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="ml-3 text-muted-foreground">
                      Loading conversations...
                    </span>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredConversations.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 flex flex-col items-center "
                      >
                        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery
                            ? "No conversations found matching your search"
                            : "No conversations yet"}
                        </p>
                        {searchQuery ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear search
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCreateConversation}
                            disabled={isCreating}
                            className="bg-primary text-primary-foreground"
                          >
                            {isCreating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            Start Your First Conversation
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      filteredConversations
                        .filter(
                          (conversation): conversation is Conversation =>
                            conversation !== undefined
                        )
                        .map((conversation) => (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                              "p-4 border cursor-pointer group rounded-lg max-w-prose",
                              currentConversation?.id === conversation.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                              selectedConversations.includes(conversation.id)
                                ? "ring-1 ring-primary bg-primary/5"
                                : ""
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              {" "}
                              <input
                                type="checkbox"
                                checked={selectedConversations.includes(
                                  conversation.id
                                )}
                                onChange={() =>
                                  handleSelectConversation(conversation.id)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 rounded border-primary"
                                title="Select conversation"
                                aria-label="Select conversation"
                              />
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  handleConversationClick(conversation)
                                }
                              >
                                <div className="flex items-center justify-between mb-2">
                                  {editingId === conversation.id ? (
                                    <div className="flex items-center space-x-2 flex-1">
                                      <Input
                                        value={editTitle}
                                        onChange={(e) =>
                                          setEditTitle(e.target.value)
                                        }
                                        className="h-8 text-sm"
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter")
                                            handleSaveTitle();
                                          if (e.key === "Escape")
                                            handleCancelEdit();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveTitle();
                                        }}
                                        className="h-8 px-2"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelEdit();
                                        }}
                                        className="h-8 px-2"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate text-sm">
                                          {getConversationTitle(conversation)}
                                        </h3>{" "}
                                        <div className="flex items-center space-x-2 mt-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs py-0 px-1.5 h-5 font-normal"
                                          >
                                            {formatCount(
                                              conversation.messageCount ||
                                                conversation.messages?.length ||
                                                0
                                            )}{" "}
                                            messages
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatRelativeTime(
                                              conversation.updatedAt
                                            )}
                                          </span>
                                          {/* Show "New" badge for conversations without messages */}
                                          {(!conversation.messages ||
                                            conversation.messages.length ===
                                              0) && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs py-0 px-1.5 h-5 bg-primary/10 text-primary font-normal"
                                            >
                                              New
                                            </Badge>
                                          )}
                                        </div>
                                      </div>{" "}
                                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTitle(conversation);
                                          }}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                        >
                                          <Star className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {conversation.lastMessage ? (
                                  <p className="text-xs text-muted-foreground truncate mt-2 group-hover:text-foreground/80 transition-colors">
                                    {conversation.lastMessage.content}
                                  </p>
                                ) : conversation.messages &&
                                  conversation.messages.length > 0 ? (
                                  <p className="text-xs text-muted-foreground truncate mt-2 group-hover:text-foreground/80 transition-colors">
                                    {
                                      conversation.messages[
                                        conversation.messages.length - 1
                                      ]?.content
                                    }
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic mt-2 group-hover:text-foreground/80 transition-colors">
                                    No messages yet - click to start chatting
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                    )}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>
          <Separator />
          {/* Footer with counts and close button */}
          <div className="flex justify-between items-center  mt-2">
            <div className="text-sm text-muted-foreground">
              {filteredConversations.length} of {conversations.length}{" "}
              conversations
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <div>
              {" "}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
