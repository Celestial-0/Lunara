import { create } from 'zustand';
import { ChatState, Conversation, Message } from '../types/types';
import { apiClient } from './api-client';

// Enhanced cache for conversations and messages
const conversationCache = new Map<string, { data: Conversation; timestamp: number }>();
const messageCache = new Map<string, { data: Message[]; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds for messages
const CONVERSATION_CACHE_DURATION = 300000; // 5 minutes for conversations
export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isTyping: false,
  // Load conversations from API with enhanced caching
  loadConversations: async () => {
    try {
      set({ isLoading: true });
      const conversations = await apiClient.getConversations() as Conversation[];
      set({ conversations, isLoading: false });
      return conversations;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      set({ isLoading: false });
      return [];
    }
  },
  // Load a specific conversation with messages and enhanced caching
  loadConversation: async (id: string) => {
    try {
      set({ isLoading: true });
      
      // Check cache first
      const cached = conversationCache.get(id);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CONVERSATION_CACHE_DURATION) {
        set({ currentConversation: cached.data, isLoading: false });
        return;
      }

      const conversation = await apiClient.getConversation(id) as Conversation;
      
      // Cache the conversation
      conversationCache.set(id, { data: conversation, timestamp: now });
      
      set({ currentConversation: conversation, isLoading: false });
      
      // Update conversations list with the loaded conversation
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? conversation : conv
        ),
      }));
    } catch (error) {
      console.error('Failed to load conversation:', error);
      set({ isLoading: false });
    }
  },
  // Load messages for a conversation (optimized for real-time updates)
  loadMessages: async (conversationId: string) => {
    try {
      // Check cache first
      const cached = messageCache.get(conversationId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        set((state) => ({
          currentConversation: state.currentConversation?.id === conversationId
            ? { ...state.currentConversation, messages: cached.data }
            : state.currentConversation,
        }));
        return;
      }

      const messages = await apiClient.getMessages(conversationId) as Message[];
      
      // Cache the messages
      messageCache.set(conversationId, { data: messages, timestamp: now });
      
      set((state) => ({
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, messages }
          : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  // Update conversation locally without API call (for immediate UI updates)
  updateConversationLocally: (id: string, updates: Partial<Conversation>) => {
    set((state) => ({
      currentConversation: state.currentConversation?.id === id
        ? { ...state.currentConversation, ...updates }
        : state.currentConversation,
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    }));

    // Invalidate cache for this conversation
    conversationCache.delete(id);
    messageCache.delete(id);
  },

  addMessage: async (message) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    try {      // Save to API
      const savedMessage = await apiClient.createMessage(currentConversation.id, {
        content: message.content,
        role: message.role,
        audioUrl: message.audioUrl || undefined,
      }) as Message;

      // Update current conversation with new message
      const updatedConversation = {
        ...currentConversation,
        messages: [...(currentConversation.messages || []), savedMessage],
        updatedAt: new Date(),
      } as Conversation;      set((state) => ({
        currentConversation: updatedConversation,
        conversations: state.conversations.map((conv) =>
          conv.id === updatedConversation.id ? {
            ...conv,
            updatedAt: updatedConversation.updatedAt,
            lastMessage: savedMessage,
          } as Conversation : conv
        ),
      }));

      // Invalidate cache
      conversationCache.delete(currentConversation.id);
      messageCache.delete(currentConversation.id);
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
    
    // Load messages for the selected conversation if not already loaded or stale
    if (conversation && (!conversation.messages || conversation.messages.length === 0)) {
      get().loadMessages(conversation.id);
    }
  },
  setIsTyping: (typing) => {
    set({ isTyping: typing });
  },

  createConversation: async (title?: string | null) => {
    try {
      const newConversation = await apiClient.createConversation({ title }) as Conversation;
      
      set((state) => ({
        conversations: [newConversation, ...state.conversations],
        currentConversation: newConversation,
      }));

      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },  updateConversation: async (id: string, updates: { title?: string | null }) => {
    try {
      const updatedConversation = await apiClient.updateConversation(id, updates) as Partial<Conversation>;
      
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, ...(updatedConversation as object) } : conv
        ),
        currentConversation: state.currentConversation?.id === id
          ? { ...state.currentConversation, ...(updatedConversation as object) }
          : state.currentConversation,
      }));

      // Invalidate cache
      conversationCache.delete(id);
    } catch (error) {
      console.error('Failed to update conversation:', error);
      throw error;
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await apiClient.deleteConversation(id);
      
      set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
        currentConversation: state.currentConversation?.id === id
          ? null
          : state.currentConversation,
      }));

      // Clear cache
      conversationCache.delete(id);
      messageCache.delete(id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  // Enhanced refresh with throttling and smart caching
  refreshConversations: (() => {
    let lastRefresh = 0;
    const THROTTLE_MS = 5000; // Only refresh every 5 seconds max

    return async () => {
      const now = Date.now();
      if (now - lastRefresh < THROTTLE_MS) {
        return get().conversations; // Return cached data
      }
      
      lastRefresh = now;
      return await get().loadConversations();
    };
  })(),
}));