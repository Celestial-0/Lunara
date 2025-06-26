export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  accounts?: Account[];
  sessions?: Session[];
  conversations?: Conversation[];
  preferences?: UserPreferences | null;
  profile?: UserProfile | null;
  notifications?: Notification[];
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  
  user: User;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  user: User;
  messages: Message[];
  
  // Client-side properties (not in DB schema)
  messageCount?: number;
  lastMessage?: Message | null;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  audioUrl?: string | null;
  createdAt: Date;
  
  conversation?: Conversation;
}

export interface UserPreferences {
  id: string;
  userId: string;
  aiPersonality: AIPersonality;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voicePitch: number;
  theme: Theme;
  messageCount: number;
  geminiApiKey?: string | null;
  
  user: User;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  avatar?: string | null;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  user: User;
}

export interface Notification {
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
  
  user?: User;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NotificationMetadata {
  lastUpdated: string;
  filters: Record<string, unknown>;
}

export interface SearchResults {
  conversations: Array<{
    id: string;
    title: string | null;
    messageCount: number;
    updatedAt: Date;
    type: 'conversation';
  }>;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
    conversationId: string;
    conversationTitle: string | null;
    type: 'message';
  }>;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isTyping: boolean;
  
  // Actions
  loadConversations: () => Promise<Conversation[]>;
  loadConversation: (id: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  updateConversationLocally: (id: string, updates: Partial<Conversation>) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setIsTyping: (typing: boolean) => void;
  createConversation: (title?: string | null) => Promise<Conversation>;
  updateConversation: (id: string, updates: { title?: string | null }) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<Conversation[]>;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Auth-related types
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface SessionUser extends AuthUser {
  emailVerified: Date | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
  redirect?: boolean;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Voice chat related types
export interface VoiceChatState {
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isSpeakerMuted: boolean;
  connectionQuality: 'good' | 'fair' | 'poor';
  audioLevel: number;
  error: string | null;
  isListening: boolean;
  isSpeaking: boolean;
}

// User statistics interface
export interface UserStats {
  conversations: number;
  messages: number;
  chatTime: string;
  daysActive: number;
  joinDate: Date;
}

// UI Type refinements
export type Theme = 'light' | 'dark' | 'system';
export type AIPersonality = 'friendly' | 'professional' | 'creative' | 'analytical' | 'empathetic';

// Chat response type for AI generated responses
export interface ChatResponse {
  content: string;
  title?: string;
  messageId: string;
  error?: string;
}

// Export-related types
export interface ExportUserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  avatar?: string | null;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportUserPreferences {
  id: string;
  userId: string;
  aiPersonality: string;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voicePitch: number;
  theme: string;
  messageCount: number;
  geminiApiKey?: string | null;
}

export interface ExportMessage {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
}

export interface ExportConversation {
  id: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ExportMessage[];
}

export interface ExportUserData {
  name?: string | null;
  email: string;
  createdAt: Date;
  profile: ExportUserProfile | null;
  preferences: ExportUserPreferences | null;
}

export interface ExportData {
  exportedAt: string;
  userId: string;
  profile?: ExportUserData;
  conversations?: ExportConversation[];
}

export type ExportFormat = 'json' | 'csv';
export type ExportType = 'all' | 'conversations' | 'profile';