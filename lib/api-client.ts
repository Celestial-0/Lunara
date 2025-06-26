// Enhanced API client utilities for frontend with real-time support
import type { 
  Conversation, 
  Message, 
  UserPreferences, 
  UserProfile,
  Notification,
  SearchResults,
  UserStats,
  ApiError,
  PaginationInfo,
  Theme,
  AIPersonality,
  ChatResponse 
} from '../types/types';

export class ApiClient {  private baseUrl: string;
  private requestQueue: Map<string, Promise<unknown>> = new Map();
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const requestKey = `${options.method || 'GET'}-${url}`;
    
    // Prevent duplicate requests
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey) as Promise<T>;
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const requestPromise = this.executeRequest<T>(url, config);
    this.requestQueue.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up request queue after a short delay
      setTimeout(() => {
        this.requestQueue.delete(requestKey);
      }, 1000);
    }
  }
  private async executeRequest<T>(url: string, config: RequestInit): Promise<T> {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError & {
        messageCount?: number;
        limit?: number;
      };
      
      // For the free limit reached error, throw the full error data
      if (errorData.error === 'FREE_LIMIT_REACHED') {
        throw errorData;
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats - some endpoints might return data directly
    // while others follow the ApiResponse<T> structure
    if (responseData && typeof responseData === 'object') {
      // If response has a success property that's explicitly false, it's an error
      if (responseData.success === false) {
        throw new Error(responseData.error || responseData.message || 'Request failed');
      }
      
      // If it follows ApiResponse format with success=true, return the data
      if (responseData.success === true && responseData.data !== undefined) {
        return responseData.data as T;
      }
      
      // If it doesn't have a success field, assume the entire response is the data
      // This handles APIs that return data directly without wrapping
      return responseData as T;
    }
    
    return responseData as T;
  }
  // Chat - Enhanced with real-time support
  async sendChatMessage(conversationId: string, message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    });
  }

  // Conversations - Enhanced with caching headers
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations', {
      headers: {
        'Cache-Control': 'max-age=30', // 30 second cache
      },
    });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`, {
      headers: {
        'Cache-Control': 'max-age=60', // 1 minute cache
      },
    });
  }

  async createConversation(data: { title?: string | null } = {}): Promise<Conversation> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, data: { title?: string | null }): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    return this.request<void>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Messages - Optimized for real-time updates
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages`, {
      headers: {
        'Cache-Control': 'max-age=10', // 10 second cache for messages
      },
    });
  }

  async createMessage(conversationId: string, data: {
    content: string;
    role: 'user' | 'assistant';
    audioUrl?: string | null;
  }): Promise<Message> {
    return this.request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMessage(id: string, data: {
    content?: string;
    audioUrl?: string | null;
  }): Promise<Message> {
    return this.request<Message>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMessage(id: string): Promise<void> {
    return this.request<void>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    return this.request<UserPreferences>('/preferences');
  }

  async updatePreferences(data: {
    aiPersonality?: AIPersonality;
    voiceEnabled?: boolean;
    voiceSpeed?: number;
    voicePitch?: number;
    theme?: Theme;
  }): Promise<UserPreferences> {
    return this.request<UserPreferences>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetPreferences(): Promise<UserPreferences> {
    return this.request<UserPreferences>('/preferences', {
      method: 'DELETE',
    });
  }

  // Profile
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile');
  }

  async updateProfile(data: Partial<Omit<UserProfile, 'id' | 'userId' | 'user' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile> {
    return this.request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async updateProfileAvatar(formData: FormData): Promise<{ avatar: string }> {
    const response = await fetch(`${this.baseUrl}/api/profile/avatar`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError;
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Handle different response formats
    if (responseData && typeof responseData === 'object') {
      // If response has a success property that's explicitly false, it's an error
      if (responseData.success === false) {
        throw new Error(responseData.error || responseData.message || 'Avatar update failed');
      }
      
      // If it follows ApiResponse format with success=true, return the data
      if (responseData.success === true && responseData.data !== undefined) {
        return responseData.data as { avatar: string };
      }
      
      // If response has avatar property directly, return it
      if (responseData.avatar) {
        return { avatar: responseData.avatar };
      }
    }
    
    return responseData as { avatar: string };
  }

  async getProfileStats(): Promise<UserStats> {
    return this.request<UserStats>('/profile/stats');
  }
  // Notifications - Enhanced for real-time updates
  async getNotifications(params: { 
    includeRead?: boolean;
    limit?: number;
    page?: number;
    type?: string;
    priority?: string;
  } = {}): Promise<{ data: Notification[]; pagination?: PaginationInfo; unreadCount?: number }> {
    const searchParams = new URLSearchParams();
    if (params.includeRead !== undefined) searchParams.append('includeRead', params.includeRead.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.priority) searchParams.append('priority', params.priority);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    
    // Use fetch directly to get the full response including pagination
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=5', // 5 second cache for notifications
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    
    // Return the response structure with data, pagination, unreadCount
    return {
      data: responseData.data || [],
      pagination: responseData.pagination,
      unreadCount: responseData.unreadCount
    };
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }
  async markAllNotificationsRead(): Promise<void> {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
  async clearAllNotifications(): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>('/notifications', {
      method: 'DELETE',
    });
  }
  async getNotification(id: string): Promise<Notification> {
    return this.request<Notification>(`/notifications/${id}`);  }

  // Account Management
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/profile/delete-account', {
      method: 'DELETE',
    });
  }

  // Search
  async search(query: string, type: 'all' | 'conversations' | 'messages' = 'all'): Promise<SearchResults> {
    const params = new URLSearchParams({ q: query, type });
    return this.request<SearchResults>(`/search?${params}`);
  }

  // Export
  async exportData(format: 'json' | 'csv' = 'json', type: 'all' | 'conversations' | 'profile' = 'all'): Promise<object | string> {
    const params = new URLSearchParams({ format, type });
    const response = await fetch(`${this.baseUrl}/api/export?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' })) as ApiError;
      throw new Error(errorData.error || `Export failed: ${response.statusText}`);
    }

    if (format === 'csv') {
      return response.text();
    }
    
    return response.json();
  }

  // Real-time polling helper
  async pollForUpdates(conversationId: string, lastMessageCount: number): Promise<{
    hasUpdates: boolean;
    messages: Message[];
    newMessageCount: number;
  }> {
    try {
      const messages = await this.getMessages(conversationId);
      return {
        hasUpdates: messages.length > lastMessageCount,
        messages,
        newMessageCount: Math.max(0, messages.length - lastMessageCount),
      };
    } catch (error) {
      console.error('Polling failed:', error);
      return {
        hasUpdates: false,
        messages: [],
        newMessageCount: 0,
      };
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();