import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceChatState } from '@/types/types';

// Extended interfaces for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVoiceChat() {
  const [state, setState] = useState<VoiceChatState>({
    isConnecting: false,
    isConnected: false,
    isMuted: false,
    isSpeakerMuted: false,
    connectionQuality: 'good',
    audioLevel: 0,
    error: null,
    isListening: false,
    isSpeaking: false,
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioElementRef.current = document.createElement('audio');
    audioElementRef.current.id = 'voice-chat-audio';
    document.body.appendChild(audioElementRef.current);

    return () => {
      if (audioElementRef.current) {
        document.body.removeChild(audioElementRef.current);
      }
    };
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isListening: false,
      isSpeaking: false,
      audioLevel: 0,
    }));
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const speak = useCallback(async (text: string) => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true }));

      // Use Web Speech API for TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = state.isSpeakerMuted ? 0 : 1;

        utterance.onend = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
        };

        utterance.onerror = () => {
          setState(prev => ({ ...prev, isSpeaking: false, error: "Speech synthesis failed" }));
        };

        speechSynthesis.speak(utterance);
      } else {
        setState(prev => ({ ...prev, error: "Text-to-speech not supported" }));
      }
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        error: "Failed to speak response"
      }));
    }
  }, [state.isSpeakerMuted]);

  const initializeSpeechRecognition = useCallback(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: "Speech recognition is not supported in this browser." }));
      return false;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: `Speech recognition error: ${event.error}`
      }));
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);

      setState(prev => ({ ...prev, isListening: false }));

      try {
        // Call backend chat API instead of direct Gemini call
        const response = await fetch('/api/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: transcript }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const responseText = data.content;

        // Speak the response
        await speak(responseText);
      } catch (error) {
        console.error("Failed to process voice input:", error);
        setState(prev => ({ ...prev, error: "Failed to process voice input" }));
      }
    };

    return true;
  }, [speak]);
  const startAudioLevelMonitoring = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      setState(prev => ({ ...prev, audioLevel: average / 255 }));

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  }, []);

  const initializeAudioContext = useCallback(async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      startAudioLevelMonitoring();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize audio' }));
    }
  }, [startAudioLevelMonitoring]);

  const startVoiceChat = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Initialize speech recognition
      if (!initializeSpeechRecognition()) {
        setState(prev => ({ ...prev, isConnecting: false }));
        return;
      }

      // Get user media for audio level monitoring
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      await initializeAudioContext(stream);

      // Simulate connection establishment
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionQuality: 'good',
        }));
      }, 1000);

    } catch (error) {
      console.error('Failed to start voice chat:', error);

      let errorMessage = 'Failed to start voice chat';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application';
        }
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [initializeSpeechRecognition, initializeAudioContext]);

  const endVoiceChat = useCallback(() => {
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    cleanup();
  }, [cleanup]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !state.isConnected || state.isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({ ...prev, error: 'Failed to start listening' }));
    }
  }, [state.isConnected, state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = state.isMuted;
        setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  }, [state.isMuted]);

  const toggleSpeaker = useCallback(() => {
    setState(prev => ({ ...prev, isSpeakerMuted: !prev.isSpeakerMuted }));

    // Stop current speech if muting
    if (!state.isSpeakerMuted && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [state.isSpeakerMuted]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startVoiceChat,
    endVoiceChat,
    startListening,
    stopListening,
    toggleMute,
    toggleSpeaker,
    clearError,
  };
}