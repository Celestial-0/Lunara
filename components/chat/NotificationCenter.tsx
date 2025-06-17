'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CheckCheck,
  AlertCircle
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
  onNotificationsUpdate 
}: NotificationCenterProps) {  const [notifications, setNotifications] = useState<NotificationItem[]>(propNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    // Ensure dates are properly converted from strings to Date objects
    const convertedNotifications = propNotifications.map(notification => ({
      ...notification,
      createdAt: new Date(notification.createdAt),
      updatedAt: new Date(notification.updatedAt),
      readAt: notification.readAt ? new Date(notification.readAt) : null,
      deletedAt: notification.deletedAt ? new Date(notification.deletedAt) : null,
    }));
    setNotifications(convertedNotifications);
  }, [propNotifications]);  const handleRefresh = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setError(null);
      await onNotificationsUpdate();
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      setError('Failed to refresh notifications. Please try again.');
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, [onNotificationsUpdate]);

  // Auto-refresh notifications when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      handleRefresh(false); // Silent refresh
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [open, handleRefresh]);

  const unreadCount = notifications.filter(n => !n.read && !n.deleted).length;
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
  };  const markAsRead = async (id: string) => {
    try {
      setError(null);
      const now = new Date();
      // Optimistic update - update UI immediately
      setNotifications(prev =>
        prev.map(notification =>
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
      console.error('Failed to mark notification as read:', error);
      setError('Failed to mark notification as read. Please try again.');
      // Revert optimistic update on error
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: false, readAt: null }
            : notification
        )
      );
    }
  };  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const now = new Date();
      
      // Optimistic update - update UI immediately
      setNotifications(prev =>
        prev.map(notification => ({ 
          ...notification, 
          read: true, 
          readAt: now 
        }))
      );
      
      // Make API call
      await apiClient.markAllNotificationsRead();
      
      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setError('Failed to mark all notifications as read. Please try again.');
      // Revert optimistic update on error
      await handleRefresh(false);
    } finally {
      setIsLoading(false);
    }
  };const deleteNotification = async (id: string) => {
    try {
      setError(null);
      // Optimistic update - remove from UI immediately for better UX
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Make API call for soft delete
      await apiClient.deleteNotification(id);
      
      // Update parent component's state immediately
      await onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to soft delete notification:', error);
      setError('Failed to delete notification. Please try again.');
      // Revert optimistic update on error
      await handleRefresh(false);
    }
  };  const clearAll = async () => {
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
      console.error('Failed to clear all notifications:', error);
      setError('Failed to clear all notifications. Please try again.');
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

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
        </DialogHeader>        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto h-6 w-6 p-0 hover:bg-destructive/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}          {/* Action Bar */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="font-medium">{notifications.length}</span>
                <span className="text-muted-foreground"> total</span>
                {unreadCount > 0 && (
                  <>
                    <span className="text-muted-foreground"> • </span>
                    <span className="font-medium text-primary">{unreadCount}</span>
                    <span className="text-muted-foreground"> unread</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs h-7 px-2"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isLoading || notifications.length === 0}
                className="text-xs text-destructive hover:text-destructive h-7 px-2"
              >
                <Trash2 className="w-3 h-3 mr-1" />
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
                  </div>                ) : (
                  <AnimatePresence>
                    {notifications.length === 0 ? (                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2 font-medium">No notifications yet</p>                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          You&apos;re all caught up! New notifications about your conversations, system updates, and features will appear here.
                        </p>
                      </motion.div>
                    ) : (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.02 }}                          className={cn(
                            'p-4 rounded-xl border transition-all duration-200 group hover:shadow-md relative',
                            !notification.read 
                              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' 
                              : 'border-border/50 bg-card/50 opacity-75'
                          )}
                        >                          <div className="flex items-start space-x-3">                            <div 
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 notification-icon transition-all",
                                !notification.read 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              )}
                              data-notification-type={notification.type}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "text-sm font-medium truncate pr-2",
                                    notification.read && "text-muted-foreground"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {notification.read && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      Read
                                    </Badge>
                                  )}
                                </div>                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {getPriorityBadge(notification.priority)}
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                      onClick={() => deleteNotification(notification.id)}
                                      title="Delete notification"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                                <p className={cn(
                                "text-sm mb-2 leading-relaxed",
                                notification.read ? "text-muted-foreground/80" : "text-muted-foreground"
                              )}>
                                {notification.description}
                              </p>
                                <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatTimestamp(notification.createdAt)}</span>
                                  {notification.read && notification.readAt && (
                                    <>
                                      <span>•</span>
                                      <span>Read {formatTimestamp(notification.readAt)}</span>
                                    </>
                                  )}
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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

          <Separator />          {/* Footer */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {formatRelativeTime(lastRefresh)}
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-8"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}