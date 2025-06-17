'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Check,
  X,
  Trash2,
  Settings,
  MessageSquare,
  Shield,
  Zap,
  Calendar,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface NotificationItem {
  id: string;
  userId: string;
  type: 'message' | 'system' | 'security' | 'feature';
  title: string;
  description: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationItem[];
  onNotificationsUpdate: () => void;
}

export function NotificationCenter({ 
  open, 
  onOpenChange, 
  notifications: propNotifications,
  onNotificationsUpdate 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(propNotifications || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    setNotifications(propNotifications || []);
  }, [propNotifications]);

  // Auto-refresh notifications when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      handleRefresh(false); // Silent refresh
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRefresh = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      await onNotificationsUpdate();
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'feature':
        return <Zap className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'oklch(from var(--primary) l c h)';
      case 'system':
        return 'oklch(from var(--muted-foreground) l c h)';
      case 'security':
        return 'oklch(62% 0.204 29)';
      case 'feature':
        return 'oklch(65% 0.15 145)';
      default:
        return 'oklch(from var(--primary) l c h)';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      await apiClient.markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistically remove from UI
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert on error
      await handleRefresh(false);
    }
  };

  const clearAll = async () => {
    try {
      setIsLoading(true);
      // Optimistically clear all
      setNotifications([]);
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      // Revert on error
      await handleRefresh(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'Earlier today';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Updated {formatRelativeTime(lastRefresh)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRefresh()}
                disabled={isRefreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Stay updated with your latest activity and system updates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isLoading || notifications.length === 0}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="ml-3">Loading notifications...</span>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No notifications</p>
                        <p className="text-sm text-muted-foreground">
                          You&apos;re all caught up! New notifications will appear here.
                        </p>
                      </motion.div>
                    ) : (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            'p-4 rounded-xl border transition-all duration-200 group hover:shadow-md',
                            !notification.read && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `${getNotificationColor(notification.type)} / 0.1`,
                                color: getNotificationColor(notification.type)
                              }}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="text-sm font-medium truncate pr-2">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {getPriorityBadge(notification.priority)}
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => markAsRead(notification.id)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                                {notification.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatTimestamp(notification.createdAt)}</span>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
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

          {/* Footer */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {notifications.length} total notifications
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}