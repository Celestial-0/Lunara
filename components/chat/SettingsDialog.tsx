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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  Key,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '@/components/core/ThemeProvider';
import { apiClient } from '@/lib/api-client';
import { AIPersonality } from '@/types/types';
import { signOut } from 'next-auth/react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    // Settings state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [voicePitch, setVoicePitch] = useState([1.0]);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('friendly');  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);
  
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
          messageCount?: number;
          hasApiKey?: boolean;
        }
        
        const typedPreferences = preferences as PreferencesResponse;
        
        setVoiceEnabled(typedPreferences.voiceEnabled ?? true);
        setVoiceSpeed([typedPreferences.voiceSpeed ?? 1.0]);
        setVoicePitch([typedPreferences.voicePitch ?? 1.0]);
        setMessageCount(typedPreferences.messageCount ?? 0);
        setHasApiKey(typedPreferences.hasApiKey ?? false);
        
        // Type guard to ensure aiPersonality is valid
        const validPersonalities: AIPersonality[] = ['friendly', 'professional', 'creative', 'analytical', 'empathetic'];
        const personality = typedPreferences.aiPersonality && 
          validPersonalities.includes(typedPreferences.aiPersonality as AIPersonality) 
          ? typedPreferences.aiPersonality as AIPersonality 
          : 'friendly';
          
        setAiPersonality(personality);
        
        // Don't automatically change the theme - just load the current preference
        // The theme should only be changed when user explicitly selects it
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
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

  const handleUpdateApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    setIsUpdatingApiKey(true);
    try {
      const response = await fetch('/api/preferences/gemini-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      if (response.ok) {
        setHasApiKey(true);
        setApiKeyInput('');
        await loadPreferences(); // Reload to get updated data
      } else {
        const error = await response.json();
        console.error('Failed to update API key:', error.error);
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
    } finally {
      setIsUpdatingApiKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setIsUpdatingApiKey(true);
    try {
      const response = await fetch('/api/preferences/gemini-api-key', {
        method: 'DELETE',
      });

      if (response.ok) {
        setHasApiKey(false);
        await loadPreferences(); // Reload to get updated data
      } else {
        console.error('Failed to remove API key');
      }
    } catch (error) {
      console.error('Failed to remove API key:', error);
    } finally {
      setIsUpdatingApiKey(false);
    }
  };
  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.deleteAccount();
      
      // Sign out the user and redirect to home
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      // Reset confirmation state on error
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');
    } finally {
      setIsDeleting(false);
    }
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
        <DialogContent className="max-w-[90%] sm:max-w-3xl">
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
      <DialogContent className="max-w-[90%] sm:max-w-4xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Lunara experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="voice" className="h-full">
          <TabsList className="mx-6 grid w-fit grid-cols-5 mb-4">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* Voice & Audio Tab */}
            <TabsContent value="voice" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voice Settings
                  </CardTitle>
                  <CardDescription>
                    Configure voice interaction and audio playback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Enable Voice</div>
                      <div className="text-xs text-muted-foreground">
                        Allow Lunara to speak responses aloud
                      </div>
                    </div>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Voice Speed</div>
                        <Badge variant="secondary">{voiceSpeed[0]}x</Badge>
                      </div>
                      <Slider
                        value={voiceSpeed}
                        onValueChange={setVoiceSpeed}
                        max={2}
                        min={0.5}
                        step={0.1}
                        disabled={!voiceEnabled}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Voice Pitch</div>
                        <Badge variant="secondary">{voicePitch[0]}x</Badge>
                      </div>
                      <Slider
                        value={voicePitch}
                        onValueChange={setVoicePitch}
                        max={2}
                        min={0.5}
                        step={0.1}
                        disabled={!voiceEnabled}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!voiceEnabled}
                    onClick={testVoice}
                    className="w-fit"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Test Voice
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Personality Tab */}
            <TabsContent value="ai" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Personality
                  </CardTitle>
                  <CardDescription>
                    Customize how Lunara interacts with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Personality Style</div>
                    <Select 
                      value={aiPersonality} 
                      onValueChange={(value: string) => setAiPersonality(value as AIPersonality)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            Friendly & Casual
                          </div>
                        </SelectItem>
                        <SelectItem value="professional">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500" />
                            Professional
                          </div>
                        </SelectItem>
                        <SelectItem value="creative">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Creative & Playful
                          </div>
                        </SelectItem>
                        <SelectItem value="analytical">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Analytical & Precise
                          </div>
                        </SelectItem>
                        <SelectItem value="empathetic">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-pink-500" />
                            Empathetic & Supportive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Bot className="h-4 w-4" />
                    <AlertDescription>
                      {aiPersonality === 'friendly' && "I'll be warm, approachable, and use casual language in our conversations."}
                      {aiPersonality === 'professional' && "I'll maintain a formal, business-like tone and focus on efficiency."}
                      {aiPersonality === 'creative' && "I'll be imaginative, use colorful language, and think outside the box."}
                      {aiPersonality === 'analytical' && "I'll be logical, data-driven, and provide detailed explanations."}
                      {aiPersonality === 'empathetic' && "I'll be understanding, supportive, and emotionally aware."}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage notification and behavior settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Push Notifications</div>
                      <div className="text-xs text-muted-foreground">
                        Receive notifications for new messages
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Auto-save Conversations</div>
                      <div className="text-xs text-muted-foreground">
                        Automatically save your chat history
                      </div>
                    </div>
                    <Switch
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Management Tab */}
            <TabsContent value="api" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Message Usage
                  </CardTitle>
                  <CardDescription>
                    Track your free message usage and manage API access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Free Messages Used</span>
                      <span className="text-muted-foreground">{messageCount}/15</span>
                    </div>
                    <Progress value={(messageCount / 15) * 100} className="h-2" />
                    {messageCount >= 15 && !hasApiKey && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          You&apos;ve reached the free message limit. Add your API key to continue.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key Management
                  </CardTitle>
                  <CardDescription>
                    Use your personal Gemini API key for unlimited messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasApiKey ? (
                    <div className="space-y-3">
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Personal API key is active - unlimited messages available</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveApiKey}
                            disabled={isUpdatingApiKey}
                          >
                            {isUpdatingApiKey ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Gemini API Key</div>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Enter your Gemini API key"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            disabled={isUpdatingApiKey}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleUpdateApiKey}
                            disabled={!apiKeyInput.trim() || isUpdatingApiKey}
                            size="sm"
                          >
                            {isUpdatingApiKey ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Get your free API key from{' '}
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
                        >
                          Google AI Studio
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the visual appearance of Lunara
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Color Theme</div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border bg-white" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border bg-gray-900" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border bg-gradient-to-r from-white to-gray-900" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Palette className="h-4 w-4" />
                    <AlertDescription>
                      {theme === 'light' && "Using light theme for a clean, bright interface."}
                      {theme === 'dark' && "Using dark theme for reduced eye strain in low light."}
                      {theme === 'system' && "Automatically matches your system's theme preference."}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Data Tab */}
            <TabsContent value="privacy" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Data Export
                  </CardTitle>
                  <CardDescription>
                    Download your conversation data and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that will permanently affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showDeleteConfirmation ? (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="space-y-4">
                        <div className="space-y-2">
                          <div className="font-medium text-destructive">Confirm Account Deletion</div>
                          <div className="text-sm">
                            This action cannot be undone. This will permanently delete your account and all associated data.
                          </div>
                          <div className="text-sm">
                            Type <Badge variant="destructive">DELETE</Badge> below to confirm:
                          </div>
                        </div>
                        
                        <Input
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="Type DELETE here"
                          className="font-mono"
                        />
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowDeleteConfirmation(false);
                              setDeleteConfirmationText('');
                            }}
                            disabled={isDeleting}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={confirmDeleteAccount}
                            disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                            className="flex-1"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Permanently'
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Warning:</strong> Deleting your account will permanently remove all your conversations and data. This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/50">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}