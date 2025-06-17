# Lunara - AI Companion Chat Application

A modern, real-time AI chat application built with Next.js, featuring voice chat capabilities, real-time messaging, and a beautiful user interface.

## Features

### 🤖 AI-Powered Conversations
- **Intelligent Responses**: Powered by Google's Gemini AI
- **Personality Customization**: Choose from different AI personalities (friendly, professional, creative, analytical, empathetic)
- **Context-Aware**: Maintains conversation history for meaningful interactions

### 🎙️ Voice Chat Integration
- **Speech Recognition**: Natural voice input using Web Speech API
- **Text-to-Speech**: AI responses spoken aloud
- **Real-time Audio**: Live voice conversations with Lunara
- **Audio Level Monitoring**: Visual feedback for voice activity

### 💬 Real-Time Messaging
- **Live Updates**: Messages appear instantly without page refresh
- **Optimistic UI**: Immediate feedback for better user experience
- **Smart Polling**: Efficient real-time message synchronization
- **Typing Indicators**: See when Lunara is thinking

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark/Light Themes**: System-aware theme switching
- **Smooth Animations**: Framer Motion powered interactions
- **Glass Morphism**: Modern design with backdrop blur effects

### 👤 User Management
- **Authentication**: Secure login with NextAuth.js
- **Profile Management**: Customizable user profiles with avatars
- **Conversation History**: Persistent chat history
- **Export Data**: Download your conversations

### 🔧 Advanced Features
- **Conversation Management**: Search, organize, and manage chats
- **Notification System**: Real-time activity notifications
- **Settings Panel**: Customize voice, theme, and AI behavior
- **Mobile Optimized**: Touch-friendly interface with safe area support

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with OKLCH colors
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives
- **Zustand** - Lightweight state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database
- **NextAuth.js** - Authentication with multiple providers

### AI & Voice
- **Google Gemini AI** - Advanced language model
- **Web Speech API** - Browser-native speech recognition
- **Speech Synthesis API** - Text-to-speech capabilities
- **WebRTC** - Real-time communication (future enhancement)

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Lunara-chat.git
   cd Lunara-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment vLunarables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment vLunarables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/Lunara"
   NEXTAUTH_SECRET="your-nextauth-secret"
   GEMINI_API_KEY="your-gemini-api-key"
   NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Voice Chat Setup

### Getting Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### Browser Permissions
- **Microphone Access**: Required for voice input
- **HTTPS**: Voice features work best over HTTPS in production

## Usage

### Starting a Conversation
1. **Sign up/Login** using email or Google OAuth
2. **Create a new chat** or select an existing conversation
3. **Type a message** or click the voice chat button
4. **Customize Lunara's personality** in settings

### Voice Chat
1. **Click the phone icon** in the chat header
2. **Allow microphone permissions** when prompted
3. **Click "Start Talking"** and speak naturally
4. **Lunara will respond** with both text and voice

### Managing Conversations
- **Search conversations** using the conversation manager
- **Edit conversation titles** by clicking the edit icon
- **Export your data** from the settings panel
- **Delete conversations** you no longer need

## Configuration

### AI Personality
Customize Lunara's responses in Settings:
- **Friendly**: Warm and conversational
- **Professional**: Business-focused and efficient
- **Creative**: Imaginative and colorful
- **Analytical**: Logical and data-driven
- **Empathetic**: Understanding and supportive

### Voice Settings
- **Voice Speed**: Adjust speech rate (0.5x - 2.0x)
- **Voice Pitch**: Modify voice pitch (0.5x - 2.0x)
- **Enable/Disable**: Toggle voice features

## Development

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── chat/              # Chat interface
├── components/            # React components
│   ├── chat/              # Chat-specific components
│   ├── core/              # Core UI components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── hooks/             # Custom React hooks
│   └── generated/         # Prisma generated files
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

### Key Components
- **ChatInterface**: Main chat UI with real-time messaging
- **VoiceChat**: Voice interaction component
- **MessageBubble**: Individual message display
- **Sidebar**: Navigation and conversation list
- **NotificationCenter**: Real-time notifications

### Database Schema
- **Users**: Authentication and profile data
- **Conversations**: Chat sessions
- **Messages**: Individual chat messages
- **UserPreferences**: Settings and customization
- **UserProfile**: Extended profile information

## Deployment

### Vercel (Recommended)
1. **Connect your repository** to Vercel
2. **Set environment vLunarables** in Vercel dashboard
3. **Deploy** - automatic builds on push

### Environment VLunarables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## Roadmap

- [ ] **WebRTC Integration**: Direct peer-to-peer voice calls
- [ ] **File Sharing**: Upload and discuss documents/images
- [ ] **Multi-language Support**: International voice recognition
- [ ] **Custom Voice Models**: Personalized TTS voices
- [ ] **Mobile Apps**: Native iOS and Android applications
- [ ] **Team Workspaces**: Collaborative AI assistance

---

Built with ❤️ using modern web technologies. Experience the future of AI conversation today!