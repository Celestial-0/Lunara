"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  LogOut,
  Sparkles,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/lib/store";
import { signOut, useSession } from "next-auth/react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ProfileDialog } from "./ProfileDialog";
import { ConversationManager } from "./ConversationManager";
import { NotificationCenter } from "./NotificationCenter";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Notification, UserProfile, AuthUser, Conversation } from "@/types/types";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  isOpen = true,
  onClose,
  isMobile = false,
}: SidebarProps) {  // Cast the session user to include the id property from AuthUser type
  const { data: session } = useSession();
  const user = session?.user as AuthUser | undefined;
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    loadConversations,
    refreshConversations,
  } = useChatStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showConversationManager, setShowConversationManager] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);// Define callbacks for loading data
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient.getNotifications({ 
        includeRead: false, // Only get unread for count optimization
        limit: 100 // Limit for performance
      });
      setNotifications(response?.data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await apiClient.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }, []);

  // Load conversations, notifications, and user profile on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          loadConversations(),
          loadNotifications(),
          loadUserProfile(),
        ]);
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadConversations, loadNotifications, loadUserProfile]);

  // Reduced auto-refresh frequency to prevent excessive refreshes
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        loadNotifications(); // Only refresh notifications, not conversations
      }, 30000); // Increased to 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id, loadNotifications]);

  // Only refresh on visibility change, not focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        loadNotifications();
        // Only refresh conversations if they're empty or very stale
        if (conversations.length === 0) {
          refreshConversations();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };  }, [user?.id, conversations.length, refreshConversations, loadNotifications]);

  const notificationCount = (notifications || []).filter((n) => !n.read && !n.deleted).length;

  const handleNewChat = async () => {
    try {
      await createConversation("New Conversation");
      // Only refresh notifications, not all conversations
      await loadNotifications();
      if (isMobile && onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };
  const handleConversationSelect = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // No need to refresh all conversations when selecting one
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    if (isMobile && onClose) {
      onClose();
    }
  };
  const handleConversationManagerClick = () => {
    setShowConversationManager(true);
    if (isMobile && onClose) {
      onClose();
    }
  };  const handleNotificationsClick = async () => {
    setShowNotifications(true);
    
    // Load all notifications (including read) when opening notification center
    try {
      const response = await apiClient.getNotifications({ 
        includeRead: true,
        limit: 100 
      });
      
      setNotifications(response?.data || []);
    } catch (error) {
      console.error("Failed to load all notifications:", error);
    }
    
    if (isMobile && onClose) {
      onClose();
    }
  };
  const handleNotificationsUpdate = async () => {
    // When NotificationCenter is open, refresh all notifications (including read)
    // When closed, only load unread for count optimization
    try {
      const response = await apiClient.getNotifications({ 
        includeRead: true, // Always include read notifications to show complete list
        limit: 100 
      });
      setNotifications(response?.data || []);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  // Format count for display (notifications)
  const formatCount = (count: number) => {
    if (count > 999) return "999+";
    return count.toString();
  };

  // Get relative time for last update
  const getRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };
  // Helper function to get conversation title
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title && conversation.title.trim()) {
      return conversation.title;
    }
    return "New Conversation";
  };
  // Get user avatar with priority: profile avatar > session image > fallback
  const getUserAvatar = () => {
    return userProfile?.avatar || session?.user?.image || "";
  };

  const getUserInitials = () => {
    const name = session?.user?.name || session?.user?.email || "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
              />

              {/* Mobile Sidebar */}
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-80 bg-card border-r z-50 md:hidden flex flex-col"
              >
                {/* Mobile Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    {" "}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center space-x-2"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="text-lg font-semibold">Lunara</span>
                    </motion.div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNotificationsClick}
                        className="rounded-xl relative"
                      >
                        <Bell className="h-4 w-4" />
                        {notificationCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                          >
                            {formatCount(notificationCount)}
                          </Badge>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-xl"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4 space-y-2"
                  >
                    <Button
                      onClick={handleNewChat}
                      className="w-full justify-start rounded-xl h-12"
                      variant="secondary"
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Chat
                    </Button>


                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleConversationManagerClick}
                        className="w-full rounded-xl justify-start"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                  </motion.div>
                </div>

                {/* Mobile Conversations */}
                <ScrollArea className="flex-1 px-2">
                  <div className="space-y-2 py-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                        />
                        <span className="ml-3 text-sm">
                          Loading conversations...
                        </span>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-sm">
                          No conversations yet
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Start a new chat to begin
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <AnimatePresence>
                          {conversations.map((conversation, index) => (
                            <motion.button
                              key={conversation.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() =>
                                handleConversationSelect(conversation)
                              }
                              className={cn(
                                "w-[calc(100%-2rem)] text-left p-3 rounded-xl transition-all duration-200",
                                currentConversation?.id === conversation.id
                                  ? "bg-primary/10 ring-1 ring-primary/20"
                                  : "hover:bg-muted/80"
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center space-x-3">
                                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium truncate">
                                      {getConversationTitle(conversation)}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {getRelativeTime(conversation.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Mobile User Profile */}
                <div className="p-4 space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleProfileClick}
                    className="flex items-center space-x-3 p-3 rounded-xl w-full text-left hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={getUserAvatar()} />
                      <AvatarFallback className="bg-primary/10">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session?.user?.name || session?.user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        View Profile
                      </p>
                    </div>
                  </motion.button>{" "}
                  <div className="flex space-x-2">
                    <AnimatedThemeToggler />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}{" "}
        </AnimatePresence>

        {/* Dialogs */}
        <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />
        <ConversationManager
          open={showConversationManager}
          onOpenChange={setShowConversationManager}
        />
        <NotificationCenter
          open={showNotifications}
          onOpenChange={setShowNotifications}
          notifications={notifications}
          onNotificationsUpdate={handleNotificationsUpdate}
        />
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={cn(
          "bg-card flex flex-col h-full transition-all duration-300",
          isCollapsed ? "w-16" : "w-80"
        )}
      >
        {/* Desktop Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">Lunara</span>
              </motion.div>
            )}

            <div className="flex items-center space-x-1">
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNotificationsClick}
                  className="rounded-xl relative"
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      {formatCount(notificationCount)}
                    </Badge>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-xl"
              >
                {isCollapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 space-y-2"
            >
              <Button
                onClick={handleNewChat}
                className="w-full justify-start rounded-xl h-12"
                variant="secondary"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>


                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConversationManagerClick}
                  className="w-full rounded-xl justify-start"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>

            </motion.div>
          )}
        </div>

        {/* Desktop Conversations */}
        <ScrollArea className="flex-1 rounded-md">
          <div className="space-y-2 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                />
                {!isCollapsed && (
                  <span className="ml-3 text-sm">Loading...</span>
                )}
              </div>
            ) : conversations.length === 0 ? (
              !isCollapsed && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">
                    No conversations yet
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Start a new chat to begin
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-2">
                <AnimatePresence>
                  {conversations.map((conversation, index) => (
                    <motion.button
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleConversationSelect(conversation)}
                      className={cn(
                        "w-[calc(100%-1.5rem)] mx-auto text-left p-3 rounded-xl transition-all duration-200",
                        currentConversation?.id === conversation.id
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "hover:bg-muted/80"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {getConversationTitle(conversation)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(conversation.updatedAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Desktop User Profile */}
        <div className="p-3 space-y-3">
          {!isCollapsed && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleProfileClick}
              className="flex items-center space-x-3 p-3 rounded-xl w-full text-left hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={getUserAvatar()} />
                <AvatarFallback className="bg-primary/10">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </motion.button>
          )}{" "}
          <div
            className={cn(
              "flex",
              isCollapsed ? "flex-col space-y-2" : "space-x-2"
            )}
          >
            <AnimatedThemeToggler />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>{" "}
      {/* Dialogs */}
      <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />
      <ConversationManager
        open={showConversationManager}
        onOpenChange={setShowConversationManager}
      />
      <NotificationCenter
        open={showNotifications}
        onOpenChange={setShowNotifications}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
      />
    </>
  );
}
