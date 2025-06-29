'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Settings,
  Wifi,
  WifiOff,
  Minimize2,
  Maximize2,
  AlertCircle,
  X,
  Play,
  Square,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  voiceChatState: {
    isConnecting: boolean;
    isConnected: boolean;
    isMuted: boolean;
    isSpeakerMuted: boolean;
    connectionQuality: 'good' | 'fair' | 'poor';
    audioLevel: number;
    error: string | null;
    isListening: boolean;
    isSpeaking: boolean;
    startVoiceChat: () => Promise<void>;
    endVoiceChat: () => void;
    startListening: () => void;
    stopListening: () => void;
    toggleMute: () => void;
    toggleSpeaker: () => void;
    clearError: () => void;
  };
}

export function VoiceChat({ isOpen, onClose, voiceChatState }: VoiceChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const {
    isConnecting,
    isConnected,
    isMuted,
    isSpeakerMuted,
    connectionQuality,
    audioLevel,
    error,
    isListening,
    isSpeaking,
    startVoiceChat,
    endVoiceChat,
    startListening,
    stopListening,
    toggleMute,
    toggleSpeaker,
    clearError,
  } = voiceChatState;

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="w-3 h-3 md:w-4 md:h-4 text-green-500" />;
      case 'fair':
        return <Wifi className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-3 h-3 md:w-4 md:h-4 text-red-500" />;
    }
  };

  const getConnectionStatus = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const handleStartCall = async () => {
    clearError();
    await startVoiceChat();
  };

  const handleEndCall = () => {
    endVoiceChat();
    onClose();
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Return null when closed - no floating button
  if (!isOpen) {
    return null;
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40"
      >
        <Card className={cn(
          "w-64 md:w-72 shadow-xl border-2 backdrop-blur-sm bg-card/95",
          isConnected ? "border-green-500/50" : isConnecting ? "border-yellow-500/50" : "border-border"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground"
                  )}
                />
                <span className="text-sm font-medium">
                  {getConnectionStatus()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  onClick={handleToggleListening}
                  className="h-8 px-3 rounded-full"
                >
                  {isListening ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {isListening ? "Stop" : "Talk"}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndCall}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full interface
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-x-4 bottom-20 md:right-4 md:left-auto md:bottom-6 md:w-96 z-40"
      >
        <Card className={cn(
          "shadow-2xl border-2 backdrop-blur-sm bg-card/95",
          isConnected ? "border-green-500/50" : isConnecting ? "border-yellow-500/50" : "border-border"
        )}>
          <CardContent className="p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className={cn(
                    "w-3 h-3 rounded-full",
                    isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground"
                  )}
                />
                <span className="text-sm font-medium">
                  Voice Chat
                </span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  isConnected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  isConnecting ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-muted text-muted-foreground"
                )}>
                  {getConnectionStatus()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 h-6 px-2"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Status Indicators */}
            {isConnected && (
              <div className="mb-4 space-y-3">
                {/* Audio Level Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Audio Level</span>
                    <span>{Math.round(audioLevel * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      animate={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Activity Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {isListening && (
                      <div className="flex items-center space-x-1 text-red-500">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-2 bg-red-500 rounded-full"
                        />
                        <span>Listening...</span>
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="flex items-center space-x-1 text-blue-500">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <span>Speaking...</span>
                      </div>
                    )}
                    {!isListening && !isSpeaking && (
                      <span className="text-muted-foreground">Ready</span>
                    )}
                  </div>
                  <span className="text-muted-foreground capitalize">
                    {connectionQuality}
                  </span>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isConnecting && (
              <div className="flex items-center justify-center py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-2"
                />
                <span className="text-sm">Establishing connection...</span>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-4">
              {!isConnected && !isConnecting ? (
                <Button
                  onClick={handleStartCall}
                  className="w-full h-12 md:h-14 text-base font-medium bg-primary hover:bg-primary/90"
                  disabled={!!error}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Start Voice Chat
                </Button>
              ) : (
                <>
                  {/* Main Voice Control */}
                  {isConnected && (
                    <Button
                      onClick={handleToggleListening}
                      className={cn(
                        "w-full h-12 md:h-14 rounded-xl text-base font-medium transition-all",
                        isListening 
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" 
                          : "bg-primary hover:bg-primary/90 shadow-md"
                      )}
                      disabled={isSpeaking}
                    >
                      {isListening ? (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Start Talking
                        </>
                      )}
                    </Button>
                  )}

                  {/* Secondary Controls */}
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={toggleMute}
                      className="rounded-full h-10 w-10 md:h-12 md:w-12 transition-all hover:scale-105"
                      disabled={!isConnected}
                    >
                      {isMuted ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                    
                    <Button
                      variant={isSpeakerMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={toggleSpeaker}
                      className="rounded-full h-10 w-10 md:h-12 md:w-12 transition-all hover:scale-105"
                      disabled={!isConnected}
                    >
                      {isSpeakerMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10 md:h-12 md:w-12 transition-all hover:scale-105"
                      disabled={!isConnected}
                    >
                      <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleEndCall}
                      className="rounded-full h-10 w-10 md:h-12 md:w-12 transition-all hover:scale-105"
                    >
                      <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Help Text */}
            {!isConnected && !isConnecting && !error && (
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Start a voice conversation with Lunara using speech recognition.
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <MessageCircle className="w-3 h-3" />
                  <span>Speak naturally and Lunara will respond</span>
                </div>
              </div>
            )}

            {isConnected && !isListening && !isSpeaking && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Click &ldquo;Start Talking&rdquo; and speak to Lunara. She&apos;ll listen and respond with voice.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}