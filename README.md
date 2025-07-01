# 🌙 Lunara - AI Companion Chat Application

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io/)

A modern, real-time AI chat application built with Next.js, featuring advanced voice chat capabilities, real-time messaging, and a beautiful user interface. Lunara provides an intelligent AI companion experience with natural conversation flows and cutting-edge voice interaction technology.

## ✨ Features

### 🤖 AI-Powered Conversations
- **Intelligent Responses**: Powered by Google's Gemini AI with contextual understanding
- **Personality Customization**: Choose from 5 AI personalities (friendly, professional, creative, analytical, empathetic)
- **Context-Aware**: Maintains conversation history for meaningful, ongoing interactions
- **Custom AI Personalities**: Fine-tuned prompts for different conversation styles

### 🎙️ Voice Chat Integration
- **Speech Recognition**: Natural voice input using Web Speech API
- **Text-to-Speech**: AI responses spoken aloud with customizable voice settings
- **Real-time Audio**: Live voice conversations with visual feedback
- **Audio Level Monitoring**: Real-time audio visualization and voice activity detection
- **Voice Customization**: Adjustable speech rate, pitch, and voice preferences

### 💬 Real-Time Messaging
- **Live Updates**: Messages appear instantly without page refresh using smart polling
- **Optimistic UI**: Immediate feedback for better user experience
- **Typing Indicators**: Visual feedback when Lunara is processing responses
- **Message Management**: Edit, delete, and organize conversations

### 🎨 Modern UI/UX
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Dark/Light Themes**: System-aware theme switching with smooth transitions
- **Smooth Animations**: Framer Motion powered interactions and micro-animations
- **Glass Morphism**: Modern design with backdrop blur effects and OKLCH colors
- **Accessibility**: Built with Radix UI primitives for full accessibility support

### 👤 User Management
- **Secure Authentication**: NextAuth.js with email/password and Google OAuth
- **Profile Management**: Customizable user profiles with avatar uploads
- **Conversation History**: Persistent chat history with search and organization
- **Data Export**: Download your conversations in JSON or CSV format
- **Privacy Controls**: Granular privacy settings and data management

### 🔧 Advanced Features
- **Conversation Management**: Search, organize, and manage chat sessions
- **Notification System**: Real-time activity notifications with priority levels
- **Settings Panel**: Comprehensive customization for voice, theme, and AI behavior
- **Mobile Optimized**: Touch-friendly interface with safe area support
- **API Key Management**: Personal Gemini API key support for unlimited usage
- **Maintenance Mode**: Built-in maintenance mode for updates and deployments

## 🏗️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Server Components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development with strict mode
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling with OKLCH colors and modern features
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations and transitions
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives and design system
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management with TypeScript support
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation

### Backend & Database
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless API endpoints with middleware
- **[Prisma](https://www.prisma.io/)** - Type-safe database ORM with migrations and client generation
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database with advanced features
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication with multiple providers and session management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation with static type inference
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing library for Node.js

### AI & Voice Technology
- **[Google Gemini AI](https://ai.google.dev/)** - Advanced language model for intelligent responses
- **[@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)** - Official Google Generative AI SDK
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)** - Browser-native speech recognition
- **[Speech Synthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** - Text-to-speech capabilities
- **WebRTC** - Real-time communication (planned future enhancement)

### UI/UX Libraries
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built using Radix UI and Tailwind CSS
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Perfect dark mode in Next.js with system theme detection
- **[Sonner](https://sonner.emilkowal.ski/)** - An opinionated toast component for React
- **[class-variance-authority](https://cva.style/docs)** - Type-safe component variants with TypeScript
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind CSS classes without style conflicts
- **[clsx](https://github.com/lukeed/clsx)** - Tiny utility for constructing className strings conditionally

### Development & Deployment
- **[ESLint 9](https://eslint.org/)** - Code linting with Next.js and TypeScript rules
- **[PostCSS](https://postcss.org/)** - CSS transformation tool with plugin ecosystem
- **[Turbopack](https://turbo.build/pack)** - Incremental bundler optimized for JavaScript and TypeScript
- **[Vercel](https://vercel.com/)** - Optimized deployment platform for Next.js
- **[cross-env](https://github.com/kentcdodds/cross-env)** - Cross-platform environment variable setting

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/) or use a cloud provider
- **Google Gemini API Key** - [Get your key](https://makersuite.google.com/app/apikey)
- **Git** - [Download](https://git-scm.com/)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Celestial-0/Lunara.git
   cd Lunara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/lunara"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # AI
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000` and start chatting with Lunara!

## 🎙️ Voice Chat Setup

### Getting Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Choose your project or create a new one
   - Copy the generated API key

3. **Add to Environment**
   - Add to your `.env.local` file: `GEMINI_API_KEY="your-api-key-here"`
   - Or add directly in the app settings for personal use

### Browser Compatibility & Permissions

#### Supported Browsers
- ✅ **Chrome/Chromium**: Full support for all voice features
- ✅ **Microsoft Edge**: Full support for all voice features  
- ⚠️ **Firefox**: Limited voice recognition support
- ⚠️ **Safari**: Limited voice features, no speech recognition

#### Required Permissions
- **🎤 Microphone Access**: Required for voice input and audio level monitoring
- **🔊 Audio Playback**: Automatic for text-to-speech responses
- **🔒 HTTPS**: Voice features work best over HTTPS in production

#### Optimizing Voice Quality
- Use a quality microphone or headset for best recognition
- Speak clearly and at a normal pace
- Minimize background noise
- Ensure stable internet connection for AI processing

## 🎯 Usage Guide

### Getting Started with Conversations

1. **Sign up/Login** 
   - Use email and password or sign in with Google OAuth
   - Complete your profile setup for a personalized experience

2. **Start Your First Chat**
   - Click "New Conversation" or begin typing in the chat interface
   - Choose an AI personality that matches your conversation style
   - Ask questions, seek advice, or just have a friendly chat

3. **Voice Chat Features**
   - Click the phone icon in the chat header to start voice mode
   - Allow microphone permissions when prompted
   - Click "Start Talking" and speak naturally to Lunara
   - Lunara will respond with both text and voice

### Managing Your Experience

- **Search Conversations**: Use the conversation manager to find past chats
- **Edit Titles**: Click the edit icon to rename conversations
- **Export Data**: Download your conversation history from settings
- **Customize Settings**: Adjust voice, theme, and AI behavior preferences
- **Manage API Keys**: Add your personal Gemini API key for unlimited usage

## ⚙️ Configuration

### AI Personality Settings
Customize Lunara's conversation style in the Settings panel:

- **🤗 Friendly**: Warm, conversational, and supportive responses
- **💼 Professional**: Business-focused, efficient, and direct communication
- **🎨 Creative**: Imaginative, colorful language, and innovative thinking
- **📊 Analytical**: Logical, data-driven, and detailed explanations
- **💝 Empathetic**: Understanding, emotionally aware, and compassionate

### Voice Configuration
Fine-tune voice interaction settings:

- **Voice Speed**: Adjust speech rate from 0.5x to 2.0x
- **Voice Pitch**: Modify voice pitch from 0.5x to 2.0x
- **Enable/Disable**: Toggle voice features on/off
- **Audio Feedback**: Visual audio level monitoring
- **Browser Compatibility**: Works best in Chrome and Edge

### API Key Management
For unlimited usage, add your personal Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it in Settings → API Key Management
4. Enjoy unlimited conversations without rate limits

### Theme & Appearance
- **System**: Automatically matches your device's theme
- **Light**: Clean, bright interface for daytime use
- **Dark**: Easy on the eyes for evening conversations

## 🛠️ Development

### Project Architecture

```
Lunara/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes and endpoints
│   │   ├── auth/               # Authentication endpoints
│   │   ├── chat/               # AI chat processing
│   │   ├── conversations/      # Conversation management
│   │   ├── messages/           # Message handling
│   │   ├── notifications/      # Notification system
│   │   ├── preferences/        # User settings
│   │   ├── profile/            # Profile management
│   │   ├── search/             # Search functionality
│   │   └── export/             # Data export
│   ├── auth/                   # Authentication pages
│   ├── chat/                   # Main chat interface
│   ├── maintenance/            # Maintenance mode pages
│   ├── globals.css             # Global styles and Tailwind
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Home page
├── components/                  # React components
│   ├── auth/                   # Authentication components
│   │   ├── AuthProvider.tsx    # Auth context provider
│   │   └── SignInForm.tsx      # Login/signup form
│   ├── chat/                   # Chat-specific components
│   │   ├── ChatInterface.tsx   # Main chat UI
│   │   ├── VoiceChat.tsx       # Voice chat interface
│   │   ├── MessageBubble.tsx   # Individual messages
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── SettingsDialog.tsx  # Settings panel
│   │   ├── ProfileDialog.tsx   # Profile management
│   │   ├── ConversationManager.tsx  # Chat organization
│   │   ├── NotificationCenter.tsx   # Notifications
│   │   ├── AudioControls.tsx   # Audio controls
│   │   ├── TypingIndicator.tsx # Loading states
│   │   └── ApiKeyDialog.tsx    # API key management
│   ├── core/                   # Core UI components
│   │   ├── ThemeProvider.tsx   # Theme management
│   │   ├── ThemeToggle.tsx     # Theme switcher
│   │   └── HomeUI.tsx          # Landing page
│   └── ui/                     # Reusable UI components (Radix)
├── lib/                        # Utilities and configurations
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Database client
│   ├── store.ts                # Zustand state management
│   ├── utils.ts                # Utility functions
│   ├── api-client.ts           # API client wrapper
│   ├── hooks/                  # Custom React hooks
│   │   ├── useApi.ts           # API integration hook
│   │   ├── useRealTimeMessages.ts  # Real-time updates
│   │   └── useVoiceChat.ts     # Voice chat functionality
│   └── generated/              # Prisma generated files
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                     # Static assets
├── types/                      # TypeScript type definitions
│   └── types.ts                # Shared type definitions
├── .env.example                # Environment variables template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

### Key Components Deep Dive

#### Core Chat Components
- **`ChatInterface`**: Main chat UI with real-time messaging, voice controls, and mobile optimization
- **`VoiceChat`**: Voice interaction with speech recognition and synthesis
- **`MessageBubble`**: Individual message display with timestamps and status
- **`Sidebar`**: Navigation, conversation list, and user management
- **`NotificationCenter`**: Real-time notifications with priority levels

#### State Management
- **Zustand Store**: Lightweight state management for conversations, messages, and UI state
- **Real-time Updates**: Custom hooks for polling and optimistic updates
- **Persistence**: Session storage for UI state and local caching

#### Database Schema
- **Users**: Authentication and profile data with NextAuth integration
- **Conversations**: Chat sessions with metadata and timestamps
- **Messages**: Individual chat messages with role-based content
- **UserPreferences**: Settings, theme, and AI personality configuration
- **UserProfile**: Extended profile information and avatar management
- **Notifications**: Real-time activity notifications with read status

### Development Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lunara"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Optional Features
MAINTENANCE_MODE="false"
```

## 🚀 Deployment

### Vercel (Recommended)

Lunara is optimized for Vercel deployment:

1. **Connect Repository**
   - Fork this repository to your GitHub account
   - Connect your Vercel account to GitHub
   - Import the Lunara project

2. **Configure Environment Variables**
   ```env
   DATABASE_URL="your-production-database-url"
   NEXTAUTH_URL="https://your-domain.vercel.app"
   NEXTAUTH_SECRET="your-production-secret"
   GEMINI_API_KEY="your-gemini-api-key"
   GOOGLE_CLIENT_ID="your-google-client-id"      # Optional
   GOOGLE_CLIENT_SECRET="your-google-client-secret"  # Optional
   ```

3. **Database Setup**
   - Use a PostgreSQL provider (Railway, Supabase, PlanetScale, etc.)
   - Run migrations: `npx prisma migrate deploy`
   - Generate client: `npx prisma generate`

4. **Deploy**
   - Push to main branch for automatic deployment
   - Vercel handles build optimization and CDN distribution

### Alternative Deployment Options

#### Docker Deployment
```dockerfile
# Use official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Self-Hosted Setup
1. Clone repository on your server
2. Install Node.js 18+ and PostgreSQL
3. Set up environment variables
4. Run database migrations
5. Build and start the application
6. Configure reverse proxy (nginx/Apache)

## 🤝 Contributing

We welcome contributions to Lunara! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Getting Started

1. **Fork the repository**
   ```bash
   git fork https://github.com/Celestial-0/Lunara.git
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/Lunara.git
   cd Lunara
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

5. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```

6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes clearly
   - Link to any relevant issues
   - Wait for review and feedback

### Development Guidelines

- **Code Style**: Follow TypeScript and ESLint configurations
- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Ensure all tests pass before submitting
- **Documentation**: Update README and code comments for new features

### Areas for Contribution

- 🐛 **Bug Fixes**: Check the issues tab for known bugs
- ✨ **Features**: Voice enhancements, UI improvements, new AI personalities
- 📚 **Documentation**: API docs, tutorials, code comments
- 🧪 **Testing**: Unit tests, integration tests, E2E tests
- 🎨 **Design**: UI/UX improvements, animations, themes
- 🌐 **Internationalization**: Multi-language support

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed

## 📞 Support & Community

### Getting Help
- **📖 Documentation**: Check this README and inline code comments
- **🐛 Bug Reports**: [Create an issue](https://github.com/Celestial-0/Lunara/issues) with detailed information
- **💡 Feature Requests**: [Open a discussion](https://github.com/Celestial-0/Lunara/discussions) to propose new features
- **❓ Questions**: Use [GitHub Discussions](https://github.com/Celestial-0/Lunara/discussions) for general questions

### Stay Updated
- ⭐ Star the repository to stay notified of updates
- 👀 Watch releases for new version announcements
- 🍴 Fork to contribute and customize for your needs

## 🗺️ Roadmap

### Upcoming Features
- [ ] **🌐 WebRTC Integration**: Direct peer-to-peer voice calls with better quality
- [ ] **📎 File Sharing**: Upload and discuss documents, images, and media
- [ ] **🌍 Multi-language Support**: International voice recognition and UI translations
- [ ] **🎭 Custom Voice Models**: Personalized TTS voices and voice cloning
- [ ] **📱 Mobile Apps**: Native iOS and Android applications
- [ ] **👥 Team Workspaces**: Collaborative AI assistance for teams and organizations
- [ ] **🔌 Plugin System**: Third-party integrations and custom AI models
- [ ] **📊 Analytics Dashboard**: Conversation insights and usage statistics
- [ ] **🎮 Interactive Elements**: Games, quizzes, and interactive learning
- [ ] **🔍 Advanced Search**: Semantic search across conversation history

### Long-term Vision
- AI-powered conversation coaching and improvement suggestions
- Integration with productivity tools and calendars
- Voice-based automation and smart home control
- Advanced emotional intelligence and context understanding
- Blockchain integration for privacy and data ownership

---

<div align="center">

**Built with ❤️ using modern web technologies**

*Experience the future of AI conversation today!*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Celestial-0/Lunara)

</div>