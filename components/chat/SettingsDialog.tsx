'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Volume2,
  Mic,
  Bot,
  Palette,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/components/core/ThemeProvider';
import { apiClient } from '@/lib/api-client';
import { AIPersonality } from '@/types/types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
    // Settings state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [voicePitch, setVoicePitch] = useState([1.0]);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('friendly');  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // Define loadPreferences with useCallback to avoid dependency issues in useEffect
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const preferences = await apiClient.getPreferences();
      
      if (preferences) {
        // Type the preferences response
        interface PreferencesResponse {
          voiceEnabled?: boolean;
          voiceSpeed?: number;
          voicePitch?: number;
          aiPersonality?: string;
          theme?: string;
        }
        
        const typedPreferences = preferences as PreferencesResponse;
        
        setVoiceEnabled(typedPreferences.voiceEnabled ?? true);
        setVoiceSpeed([typedPreferences.voiceSpeed ?? 1.0]);
        setVoicePitch([typedPreferences.voicePitch ?? 1.0]);
        
        // Type guard to ensure aiPersonality is valid
        const validPersonalities: AIPersonality[] = ['friendly', 'professional', 'creative', 'analytical', 'empathetic'];
        const personality = typedPreferences.aiPersonality && 
          validPersonalities.includes(typedPreferences.aiPersonality as AIPersonality) 
          ? typedPreferences.aiPersonality as AIPersonality 
          : 'friendly';
          
        setAiPersonality(personality);
        
        // Handle theme setting with type checking
        if (typedPreferences.theme === 'light' || typedPreferences.theme === 'dark' || typedPreferences.theme === 'system') {
          setTheme(typedPreferences.theme);
        } else {
          setTheme('system');
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);
  
  // Load preferences when dialog opens
  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open, loadPreferences]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await apiClient.updatePreferences({
        voiceEnabled,
        voiceSpeed: voiceSpeed[0],
        voicePitch: voicePitch[0],
        aiPersonality,
        theme,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiClient.exportData('json', 'all');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lunara-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    console.log('Delete account requested...');
  };

  const testVoice = () => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is how I sound with your current voice settings.');
      utterance.rate = voiceSpeed[0];
      utterance.pitch = voicePitch[0];
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="ml-3">Loading settings...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Customize your Lunara experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice & Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Voice & Audio</span>
              </CardTitle>
              <CardDescription>
                Configure voice interaction and audio playback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Enable Voice</label>
                  <p className="text-xs text-muted-foreground">
                    Allow Lunara to speak responses aloud
                  </p>
                </div>
                <Switch
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Speed</label>
                  <div className="px-3">
                    <Slider
                      value={voiceSpeed}
                      onValueChange={setVoiceSpeed}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                      disabled={!voiceEnabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Slow</span>
                      <span>{voiceSpeed[0]}x</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Pitch</label>
                  <div className="px-3">
                    <Slider
                      value={voicePitch}
                      onValueChange={setVoicePitch}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                      disabled={!voiceEnabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>{voicePitch[0]}x</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={!voiceEnabled}
                onClick={testVoice}
              >
                <Mic className="w-4 h-4 mr-2" />
                Test Voice
              </Button>
            </CardContent>
          </Card>

          {/* AI Personality */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <span>AI Personality</span>
              </CardTitle>
              <CardDescription>
                Customize how Lunara interacts with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Personality Style</label>                <Select 
                  value={aiPersonality} 
                  onValueChange={(value: string) => setAiPersonality(value as AIPersonality)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly & Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative & Playful</SelectItem>
                    <SelectItem value="analytical">Analytical & Precise</SelectItem>
                    <SelectItem value="empathetic">Empathetic & Supportive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl" style={{
                background: `oklch(from var(--muted) l c h / 0.5)`
              }}>
                <p className="text-sm text-muted-foreground">
                  {aiPersonality === 'friendly' && "I'll be warm, approachable, and use casual language in our conversations."}
                  {aiPersonality === 'professional' && "I'll maintain a formal, business-like tone and focus on efficiency."}
                  {aiPersonality === 'creative' && "I'll be imaginative, use colorful language, and think outside the box."}
                  {aiPersonality === 'analytical' && "I'll be logical, data-driven, and provide detailed explanations."}
                  {aiPersonality === 'empathetic' && "I'll be understanding, supportive, and emotionally aware."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize the visual appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Manage notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Auto-save Conversations</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save your chat history
                  </p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Privacy & Data</span>
              </CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-destructive/20" style={{
                background: `oklch(62% 0.204 29 / 0.05)`
              }}>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Deleting your account will permanently remove all your conversations and data. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}