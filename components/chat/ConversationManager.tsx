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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Download,
  Star,
  Filter,
  Loader2,
  Check,
  X,
  RefreshCw,
  Plus,
  MoreVertical,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [editingTitle, setEditingTitle] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("all");

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
        .map((result: SearchResults["conversations"][0]) =>
          conversations.find((conv) => conv.id === result.id)
        )
        .filter(Boolean)
    : conversations.filter((conv) => {
        const title = getConversationTitle(conv);
        return (
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages?.slice(0, 50).some(
            (
              msg // Limit search to first 50 messages for performance
            ) => msg.content.toLowerCase().includes(searchQuery.toLowerCase())
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
          .map((conv: Conversation | undefined) => conv?.id)
          .filter(
            (id: string | undefined): id is string => typeof id === "string"
          )
      );
    }
  };
  const handleEditTitle = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(getConversationTitle(conversation));
  };

  const handleSaveTitle = async () => {
    if (!editingId) return;

    try {
      const newTitle = editingTitle.trim() || "New Conversation";
      await updateConversation(editingId, { title: newTitle });
      setEditingId(null);
      setEditingTitle("");
      // Refresh to get updated data
      await handleRefresh(false);
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
        <DialogContent className="max-w-[90%] w-3xl h-[85vh] flex flex-col overflow-hidden [&>button]:hidden p-0">
          <div className="flex-shrink-0 p-4 pb-0">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      Conversation Manager
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {conversations.length} conversations
                      </Badge>
                      {/* <Badge variant="outline" className="text-xs font-normal">
                        Last updated :{formatRelativeTime(new Date(lastRefresh))}
                      </Badge> */}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRefresh()}
                    disabled={isRefreshing}
                    className="shrink-0"
                    title="Refresh conversations"
                  >
                    <RefreshCw
                      className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                    />
                  </Button>
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm">
                Manage, search, and organize all your conversations in one place
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden px-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col h-full"
            >
              <div className="flex-shrink-0 space-y-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <TabsList className="grid w-full sm:w-fit grid-cols-3 sm:grid-cols-auto">
                    <TabsTrigger
                      value="all"
                      className="text-xs sm:text-sm px-3 py-1.5"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="recent"
                      className="text-xs sm:text-sm px-3 py-1.5"
                    >
                      <span className="sm:hidden">Recent</span>
                      <span className="hidden sm:inline">Recent</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="starred"
                      className="text-xs sm:text-sm px-3 py-1.5"
                    >
                      <span className="sm:hidden">★</span>
                      <span className="hidden sm:inline">Starred</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Search Bar - Full width on mobile */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations and messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>

                {/* Action Buttons - Responsive Layout */}
                <div className="flex flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleCreateConversation}
                    disabled={isCreating}
                    className="flex-1 sm:flex-none h-10"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4  animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 " />
                    )}
                    <span className="hidden sm:inline">New Chat</span>
                  </Button>

                  <div className="flex gap-2">

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none h-10 "
                        >
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline ">Filter</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Recent Conversations
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="w-4 h-4 mr-2" />
                          Starred
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          This Week
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll">
                  
                {/* Bulk Actions Bar */}
                <AnimatePresence>
                  {selectedConversations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <Card className="bg-secondary/50 border-secondary shadow-sm p-0">
                        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-medium">
                              {selectedConversations.length} selected
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAll}
                              className="h-8 text-xs"
                            >
                              {selectedConversations.length ===
                              filteredConversations.length
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleExportSelected}
                              disabled={isLoading}
                              className="h-8 flex-1 sm:flex-none"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">
                                Export
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteDialog(true)}
                              className="h-8 text-destructive hover:text-destructive flex-1 sm:flex-none"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline ml-1">
                                Delete
                              </span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Conversations List */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full w-full [&>[data-radix-scroll-area-viewport]]:scrollbar-none [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll">
                    <div className="pb-4 pr-4 space-y-3">
                      {isRefreshing && conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4 col-span-full">
                          <div className="flex items-center justify-center w-8 h-8 border-2 rounded-full animate-spin border-primary">
                            <div className="w-2 h-2 bg-transparent border-t-2 border-primary rounded-full" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Loading conversations...
                          </p>
                        </div>
                      ) : (
                        <AnimatePresence mode="wait">
                          {filteredConversations.length === 0 ? (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex flex-col items-center justify-center py-16 space-y-4 col-span-full"
                            >
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="font-medium">
                                  {searchQuery
                                    ? "No conversations found"
                                    : "No conversations yet"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                  {searchQuery
                                    ? `No conversations match "${searchQuery}". Try adjusting your search.`
                                    : "Start your first conversation to see it here."}
                                </p>
                              </div>
                              {searchQuery ? (
                                <Button
                                  variant="outline"
                                  onClick={() => setSearchQuery("")}
                                >
                                  Clear search
                                </Button>
                              ) : (
                                <Button
                                  onClick={handleCreateConversation}
                                  disabled={isCreating}
                                >
                                  {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                  )}
                                  Start Your First Conversation
                                </Button>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="list"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="space-y-3"
                            >
                              {filteredConversations
                                .filter(
                                  (
                                    conversation: Conversation | undefined
                                  ): conversation is Conversation =>
                                    conversation !== undefined
                                )
                                .map((conversation: Conversation) => (
                                  <Card
                                    key={conversation.id}
                                    className={cn(
                                      "cursor-pointer transition-all duration-200 group hover:shadow-md p-0",
                                      currentConversation?.id ===
                                        conversation.id
                                        ? "border-primary shadow-sm bg-primary/5"
                                        : "hover:border-primary/50",
                                      selectedConversations.includes(
                                        conversation.id
                                      )
                                        ? "border-primary bg-primary/5"
                                        : ""
                                    )}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedConversations.includes(
                                            conversation.id
                                          )}
                                          onChange={() =>
                                            handleSelectConversation(
                                              conversation.id
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-1 rounded"
                                          aria-label={`Select conversation: ${getConversationTitle(
                                            conversation
                                          )}`}
                                        />
                                        <div
                                          className="flex-1 min-w-0"
                                          onClick={() =>
                                            handleConversationClick(
                                              conversation
                                            )
                                          }
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            {editingId === conversation.id ? (
                                              <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                  value={editingTitle}
                                                  onChange={(e) =>
                                                    setEditingTitle(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="h-8 text-sm"
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                      handleSaveTitle();
                                                    if (e.key === "Escape")
                                                      handleCancelEdit();
                                                  }}
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  autoFocus
                                                />
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSaveTitle();
                                                    }}
                                                    className="h-8 w-8 p-0"
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
                                                    className="h-8 w-8 p-0"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="flex-1 min-w-0 space-y-2">
                                                  <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-sm truncate">
                                                      {getConversationTitle(
                                                        conversation
                                                      )}
                                                    </h3>
                                                    {(!conversation.messages ||
                                                      conversation.messages
                                                        .length === 0) && (
                                                      <Badge
                                                        variant="secondary"
                                                        className="text-xs h-5 shrink-0"
                                                      >
                                                        New
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs h-5 font-normal"
                                                    >
                                                      {formatCount(
                                                        conversation.messageCount ||
                                                          conversation.messages
                                                            ?.length ||
                                                          0
                                                      )}{" "}
                                                      messages
                                                    </Badge>
                                                    <span>•</span>
                                                    <span>
                                                      {formatRelativeTime(
                                                        conversation.updatedAt
                                                      )}
                                                    </span>
                                                  </div>
                                                  {conversation.lastMessage ? (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                      {conversation.lastMessage
                                                        .content.length > 100
                                                        ? `${conversation.lastMessage.content.substring(
                                                            0,
                                                            100
                                                          )}...`
                                                        : conversation
                                                            .lastMessage
                                                            .content}
                                                    </p>
                                                  ) : conversation.messages &&
                                                    conversation.messages
                                                      .length > 0 ? (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                      {(() => {
                                                        const lastMessage =
                                                          conversation.messages[
                                                            conversation
                                                              .messages.length -
                                                              1
                                                          ]?.content || "";
                                                        return lastMessage.length >
                                                          100
                                                          ? `${lastMessage.substring(
                                                              0,
                                                              100
                                                            )}...`
                                                          : lastMessage;
                                                      })()}
                                                    </p>
                                                  ) : (
                                                    <p className="text-xs text-muted-foreground italic">
                                                      Click to start chatting
                                                    </p>
                                                  )}
                                                </div>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      onClick={(e) =>
                                                        e.stopPropagation()
                                                      }
                                                    >
                                                      <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTitle(
                                                          conversation
                                                        );
                                                      }}
                                                    >
                                                      <Edit2 className="w-4 h-4 mr-2" />
                                                      Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                      <Star className="w-4 h-4 mr-2" />
                                                      Add to favorites
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConversationToDelete(
                                                          conversation.id
                                                        );
                                                        setShowDeleteDialog(
                                                          true
                                                        );
                                                      }}
                                                      className="text-destructive focus:text-destructive"
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-2" />
                                                      Delete
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="recent"
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="flex flex-col items-center justify-center py-16 space-y-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">Recent Conversations</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Your recent conversations will appear here
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="starred"
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="flex flex-col items-center justify-center py-16 space-y-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Star className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">Starred Conversations</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Star your favorite conversations to find them easily
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-shrink-0 px-6 pb-6">
            <Separator className="mb-4" />
            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredConversations.length} of {conversations.length}{" "}
                conversations
                {searchQuery && (
                  <span className="ml-1">
                    for &ldquo;
                    <span className="font-medium">{searchQuery}</span>&rdquo;
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversations</AlertDialogTitle>
            <AlertDialogDescription>
              {conversationToDelete
                ? "Are you sure you want to delete this conversation? This action cannot be undone."
                : `Are you sure you want to delete ${
                    selectedConversations.length
                  } conversation${
                    selectedConversations.length > 1 ? "s" : ""
                  }? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConversationToDelete(null);
                setShowDeleteDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (conversationToDelete) {
                  await deleteConversation(conversationToDelete);
                  setConversationToDelete(null);
                } else {
                  await handleDeleteSelected();
                }
                setShowDeleteDialog(false);
                await handleRefresh(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
