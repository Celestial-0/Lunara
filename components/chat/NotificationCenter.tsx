"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  X,
  Trash2,
  Settings,
  MessageSquare,
  Shield,
  Zap,
  RefreshCw,
  CheckCheck,
  AlertCircle,
  MoreHorizontal,
  BellPlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface NotificationItem {
  id: string;
  userId: string;
  type: "message" | "system" | "security" | "feature";
  title: string;
  description: string;
  read: boolean;
  priority: "low" | "medium" | "high";
  deleted: boolean;
  deletedAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications?: NotificationItem[];
  onNotificationsUpdate: () => void;
}

export function NotificationCenter({
  open,
  onOpenChange,
  notifications: propNotifications = [],
  onNotificationsUpdate,
}: NotificationCenterProps) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(propNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const convertedNotifications = propNotifications.map((notification) => ({
      ...notification,
      createdAt: new Date(notification.createdAt),
      updatedAt: new Date(notification.updatedAt),
      readAt: notification.readAt ? new Date(notification.readAt) : null,
      deletedAt: notification.deletedAt
        ? new Date(notification.deletedAt)
        : null,
    }));
    setNotifications(convertedNotifications);
  }, [propNotifications]);
  const handleRefresh = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setIsRefreshing(true);
        }
        setError(null);
        await onNotificationsUpdate();
      } catch (error) {
        console.error("Failed to refresh notifications:", error);
        setError("Failed to refresh notifications. Please try again.");
      } finally {
        if (showLoading) {
          setIsRefreshing(false);
        }
      }
    },
    [onNotificationsUpdate]
  );

  // Auto-refresh notifications when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      handleRefresh(false);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [open, handleRefresh]);

  const unreadCount = notifications.filter((n) => !n.read && !n.deleted).length;
  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "message":
        return <MessageSquare className={iconClass} />;
      case "system":
        return <Settings className={iconClass} />;
      case "security":
        return <Shield className={iconClass} />;
      case "feature":
        return <Zap className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };
  const markAsRead = async (id: string) => {
    try {
      setError(null);
      const now = new Date();
      // Optimistic update - update UI immediately
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true, readAt: now }
            : notification
        )
      );

      // Make API call
      await apiClient.markNotificationRead(id);

      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setError("Failed to mark notification as read. Please try again.");
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: false, readAt: null }
            : notification
        )
      );
    }
  };
  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const now = new Date();

      // Optimistic update - update UI immediately
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          readAt: now,
        }))
      );

      // Make API call
      await apiClient.markAllNotificationsRead();

      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setError("Failed to mark all notifications as read. Please try again.");
      // Revert optimistic update on error
      await handleRefresh(false);
    } finally {
      setIsLoading(false);
    }
  };
  const deleteNotification = async (id: string) => {
    try {
      setError(null);
      // Optimistic update - remove from UI immediately for better UX
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );

      // Make API call for soft delete
      await apiClient.deleteNotification(id);

      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error("Failed to soft delete notification:", error);
      setError("Failed to delete notification. Please try again.");
      // Revert optimistic update on error
      await handleRefresh(false);
    }
  };
  const clearAll = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update - clear from UI immediately
      setNotifications([]);

      // Make API call to soft delete all notifications
      await apiClient.clearAllNotifications();

      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      setError("Failed to clear all notifications. Please try again.");
      // Revert optimistic update on error
      await handleRefresh(false);
    } finally {
      setIsLoading(false);
    }
  };
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "read") return notification.read;
    return notification.type === activeTab;
  });

  const getTabCount = (tabType: string) => {
    switch (tabType) {
      case "all":
        return notifications.length;
      case "unread":
        return unreadCount;
      case "read":
        return notifications.filter((n) => n.read).length;
      case "message":
        return notifications.filter((n) => n.type === "message").length;
      case "system":
        return notifications.filter((n) => n.type === "system").length;
      case "security":
        return notifications.filter((n) => n.type === "security").length;
      case "feature":
        return notifications.filter((n) => n.type === "feature").length;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] p-0 w-3xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <span>Notifications</span>
              </DialogTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRefresh()}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0 || isLoading}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark all as read
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clearAll}
                      disabled={notifications.length === 0 || isLoading}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Stay updated with your latest activity and system updates
            </DialogDescription>
          </DialogHeader>

          {/* Error Alert */}
          {error && (
            <div className="px-6 pt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 h-10">
                <TabsTrigger
                  value="all"
                  className="text-xs flex items-center gap-1"
                >
                  <span className="hidden sm:inline">All</span>

                  <Bell className="sm:inline md:hidden h-3 w-3" />

                  {getTabCount("all") > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      {getTabCount("all")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-xs flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Unread</span>

                  <BellPlusIcon className="sm:inline md:hidden h-3 w-3" />

                  {getTabCount("unread") > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {getTabCount("unread")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="message"
                  className="text-xs p-2"
                  title="Messages"
                >
                  <MessageSquare className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger
                  value="system"
                  className="text-xs p-2"
                  title="System"
                >
                  <Settings className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="text-xs p-2"
                  title="Security"
                >
                  <Shield className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger
                  value="feature"
                  className="text-xs p-2"
                  title="Features"
                >
                  <Zap className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Notifications List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-2 pt-4">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Loading notifications...
                      </p>
                    </div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground">
                        {activeTab === "all"
                          ? "No notifications yet"
                          : `No ${activeTab} notifications`}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {activeTab === "all"
                          ? "You're all caught up! New notifications will appear here."
                          : `No ${activeTab} notifications to show right now.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative rounded-lg  p-4 transition-all duration-200 hover:shadow-md ",
                        !notification.read
                          ? "border-l-primary bg-primary/5 hover:bg-primary/10"
                          : "border-l-muted hover:border-l-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                            !notification.read
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <h4
                                className={cn(
                                  "text-sm font-medium",
                                  notification.read && "text-muted-foreground"
                                )}
                              >
                                {notification.title}
                              </h4>
                              <Badge
                                variant={getPriorityVariant(
                                  notification.priority
                                )}
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => markAsRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              ) : (
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                title="Delete notification"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <p
                            className={cn(
                              "text-sm leading-relaxed",
                              notification.read
                                ? "text-muted-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {notification.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span>
                                {formatTimestamp(notification.createdAt)}
                              </span>
                              {notification.read && notification.readAt && (
                                <>
                                  <Separator
                                    orientation="vertical"
                                    className="mx-2 h-3"
                                  />
                                  <span>
                                    Read {formatTimestamp(notification.readAt)}
                                  </span>
                                </>
                              )}
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          {/* Footer */}
          <Separator />
          <div className="px-6 py-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {notifications.length > 0 && (
                  <span>
                    {notifications.length} notification
                    {notifications.length !== 1 ? "s" : ""} total
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
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
