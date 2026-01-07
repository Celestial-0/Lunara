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
    }, 5000); // Increased to 5 seconds to reduce server load
  }, [checkForNewMessages]);

  // Memoize cleanup to avoid missing dependency warning
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const lastConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      cleanup();
      lastMessageCountRef.current = 0;
      lastConversationIdRef.current = null;
      return;
    }

    // Reset message count when switching to a different conversation
    if (conversationId !== lastConversationIdRef.current) {
      lastMessageCountRef.current = currentConversation?.messages?.length || 0;
      lastConversationIdRef.current = conversationId;
    }

    startPolling();
    return cleanup;
  }, [conversationId, startPolling, cleanup]); // Removed currentConversation?.messages to prevent restart loop

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