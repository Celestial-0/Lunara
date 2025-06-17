import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';

export function useRealTimeMessages(conversationId: string | null) {
  const { updateConversationLocally, currentConversation } = useChatStore();
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);
  const lastCheckRef = useRef(Date.now());

  // Memoized checkForNewMessages to fix dependency warning
  const checkForNewMessages = useCallback(async () => {
    if (!conversationId || !currentConversation) return;

    try {
      // Get latest messages from server
      const messages = await apiClient.getMessages(conversationId);
      
      // Check if there are new messages
      if (messages.length > lastMessageCountRef.current) {
        // Update conversation with new messages
        updateConversationLocally(conversationId, {
          messages,
          updatedAt: new Date(),
        });
        
        lastMessageCountRef.current = messages.length;
        lastCheckRef.current = Date.now();
      }
    } catch (error) {
      console.error('Failed to check for new messages:', error);
    }
  }, [conversationId, currentConversation, updateConversationLocally]);

  // Memoize startPolling to avoid missing dependency warning
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPolling(true);
    intervalRef.current = setInterval(async () => {
      await checkForNewMessages();
    }, 3000);
  }, [checkForNewMessages]);

  // Memoize cleanup to avoid missing dependency warning
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!conversationId) {
      cleanup();
      return;
    }

    // Initialize last message count
    if (currentConversation?.messages) {
      lastMessageCountRef.current = currentConversation.messages.length;
    }

    startPolling();
    return cleanup;
  }, [conversationId, currentConversation?.messages, startPolling, cleanup]);

  const forceRefresh = async () => {
    if (conversationId) {
      await checkForNewMessages();
    }
  };

  return {
    isPolling,
    forceRefresh,
    lastCheck: lastCheckRef.current,
  };
}