'use client';

import { VoiceChat } from './VoiceChat';
import { useVoiceChat } from '@/lib/hooks/useVoiceChat';

interface VoiceChatWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceChatWrapper({ isOpen, onClose }: VoiceChatWrapperProps) {
  const voiceChat = useVoiceChat();

  return (
    <VoiceChat
      isOpen={isOpen}
      onClose={onClose}
      voiceChatState={voiceChat}
    />
  );
}
