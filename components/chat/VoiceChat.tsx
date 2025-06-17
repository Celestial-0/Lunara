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
  onToggle: () => void;
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

export function VoiceChat({ isOpen, onClose, onToggle, voiceChatState }: VoiceChatProps) {
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
  const getConnectionColor = () => {
    if (isConnected) return 'text-green-500';
    if (isConnecting) return 'text-yellow-500';
    return 'text-muted-foreground';
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

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-4 z-50"
      >
        <Button
          onClick={onToggle}
          size="icon"
          className={cn(
            "h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg relative",
            isConnected ? "bg-green-500 hover:bg-green-600" : "btn-primary"
          )}
        >
          {isConnected ? (
            <PhoneOff className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Phone className="h-4 w-4 md:h-5 md:w-5" />
          )}
          
          {/* Activity indicators */}
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"
            />
          )}
          {isSpeaking && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background"
            />
          )}
        </Button>
      </motion.div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >        <Card className={cn(
          "w-48 md:w-56 shadow-2xl border-2",
          isConnected ? "border-green-500" : isConnecting ? "border-yellow-500" : "border-muted-foreground"
        )}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500" : "bg-muted-foreground"
                  )}
                />
                <span className="text-xs font-medium">
                  {getConnectionStatus()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(false)}
                  className="h-5 w-5"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-5 w-5"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleToggleListening}
                  className="h-6 w-6 rounded-full"
                >
                  {isListening ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
                
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleEndCall}
                  className="h-6 w-6 rounded-full"
                >
                  <PhoneOff className="w-3 h-3" />
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
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-80 md:w-96 shadow-2xl border-2" style={{
          borderColor: getConnectionColor()
        }}>
          <CardContent className="p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">                <div 
                  className={cn(
                    "w-3 h-3 rounded-full",
                    isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500" : "bg-muted-foreground"
                  )}
                />
                <span className="text-sm font-medium">
                  Voice Chat - {getConnectionStatus()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6"
                >
                  <X className="w-3 h-3" />
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
                  <span className="text-muted-foreground">
                    Quality: {connectionQuality}
                  </span>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isConnecting && (
              <div className="flex items-center justify-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 md:w-6 md:h-6 border-2 border-primary border-t-transparent rounded-full mr-2"
                />
                <span className="text-sm">Establishing connection...</span>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-3">
              {!isConnected && !isConnecting ? (
                <Button
                  onClick={handleStartCall}
                  className="w-full btn-primary h-10 md:h-12"
                  disabled={!!error}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Start Voice Chat
                </Button>
              ) : (
                <>
                  {/* Main Voice Control */}
                  {isConnected && (
                    <Button
                      onClick={handleToggleListening}
                      className={cn(
                        "w-full h-12 md:h-14 rounded-xl text-base font-medium",
                        isListening 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "btn-primary"
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
                  <div className="flex items-center justify-center space-x-2 md:space-x-3">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={toggleMute}
                      className="rounded-full h-8 w-8 md:h-10 md:w-10"
                      disabled={!isConnected}
                    >
                      {isMuted ? <MicOff className="w-3 h-3 md:w-4 md:h-4" /> : <Mic className="w-3 h-3 md:w-4 md:h-4" />}
                    </Button>
                    
                    <Button
                      variant={isSpeakerMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={toggleSpeaker}
                      className="rounded-full h-8 w-8 md:h-10 md:w-10"
                      disabled={!isConnected}
                    >
                      {isSpeakerMuted ? <VolumeX className="w-3 h-3 md:w-4 md:h-4" /> : <Volume2 className="w-3 h-3 md:w-4 md:h-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 md:h-10 md:w-10"
                      disabled={!isConnected}
                    >
                      <Settings className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleEndCall}
                      className="rounded-full h-8 w-8 md:h-10 md:w-10"
                    >
                      <PhoneOff className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Help Text */}
            {!isConnected && !isConnecting && !error && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Start a voice conversation with Lunara using speech recognition.
                </p>
                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <MessageCircle className="w-3 h-3" />
                  <span>Speak naturally and Lunara will respond</span>
                </div>
              </div>
            )}

            {isConnected && !isListening && !isSpeaking && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
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