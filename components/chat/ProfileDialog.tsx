"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Trash2,
  Phone,
  MapPin,
  Briefcase,
  Check,
  AlertCircle,
  Loader2,
  BarChart3,
  Clock,
  MessageCircle,
  Key,
  EyeOff,
  Eye,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser, UserStats } from "@/types/types";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: session, update } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Profile data
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Privacy settings
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(true);

  // Avatar management
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState<UserStats>({
    conversations: 0,
    messages: 0,
    chatTime: "0h",
    daysActive: 1,
    joinDate: new Date(),
  });

  // Validation and feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Password status states
  const [passwordStatus, setPasswordStatus] = useState<{
    canChangePassword: boolean;
    hasPassword: boolean;
    isGoogleUser: boolean;
    requiresCurrentPassword: boolean;
    message: string;
  }>({
    canChangePassword: false,
    hasPassword: false,
    isGoogleUser: false,
    requiresCurrentPassword: true,
    message: 'change_password'
  });

  // Delete account states
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Load profile data when dialog opens
  useEffect(() => {
    if (open && sessionUser?.id) {
      loadProfileData();
      loadUserStats();
      loadPasswordStatus();
    }
  }, [open, sessionUser?.id]);

  // Helper function for form field rendering
  const renderFormField = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    placeholder: string,
    errorKey?: string,
    type: string = "text",
    required: boolean = false
  ) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {isEditing ? (
          <div className="space-y-1">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={cn(
                "transition-colors duration-200",
                errorKey && errors[errorKey] ? "border-destructive focus-visible:ring-destructive/20" : ""
              )}
              type={type}
              placeholder={placeholder}
              disabled={isSaving}
            />
            {errorKey && errors[errorKey] && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{errors[errorKey]}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-2 px-3 rounded-md bg-muted/50">
            {value || "Not set"}
          </div>
        )}
      </div>
    );
  };

  // Reset form when session changes
  useEffect(() => {
    if (sessionUser) {
      setName(sessionUser.name || "");
      setEmail(sessionUser.email || "");
    }
  }, [sessionUser]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();

        // Update form with profile data
        if (data.profile) {
          setBio(data.profile.bio || "");
          setPhone(data.profile.phone || "");
          setLocation(data.profile.location || "");
          setWebsite(data.profile.website || "");
          setCompany(data.profile.company || "");
          setJobTitle(data.profile.jobTitle || "");
          setShowEmail(data.profile.showEmail);
          setShowPhone(data.profile.showPhone);
          setShowLocation(data.profile.showLocation);
          setAvatarPreview(data.profile.avatar);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadUserStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/profile/stats");
      if (response.ok) {
        const data = await response.json();
        setStats({
          conversations: data.conversations,
          messages: data.messages,
          chatTime: data.chatTime,
          daysActive: data.daysActive,
          joinDate: new Date(data.joinDate),
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadPasswordStatus = async () => {
    try {
      const response = await fetch("/api/profile/password-status");
      if (response.ok) {
        const data = await response.json();
        setPasswordStatus(data);
      }
    } catch (error) {
      console.error("Failed to load password status:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (website && website.trim() && !/^https?:\/\/.+/.test(website)) {
      newErrors.website = "Website must start with http:// or https://";
    }

    if (
      phone &&
      phone.trim() &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setErrors({});

    try {
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim() || "",
        phone: phone.trim() || "",
        location: location.trim() || "",
        website: website.trim() || "",
        company: company.trim() || "",
        jobTitle: jobTitle.trim() || "",
        avatar: avatarPreview || "",
        showEmail,
        showPhone,
        showLocation,
      };

      console.log("Sending profile data:", profileData);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        if (data.details) {
          // Handle validation errors from server
          const serverErrors: Record<string, string> = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            serverErrors[detail.field] = detail.message;
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: data.error || "Failed to save profile" });
        }
        return;
      } // Update session with new data
      if (
        session &&
        sessionUser &&
        (name !== sessionUser.name || email !== sessionUser.email)
      ) {
        await update({
          ...session,
          user: {
            ...sessionUser,
            name,
            email,
            image: avatarPreview || sessionUser.image,
          },
        });
      }

      // Show success state
      setSaveSuccess(true);
      setIsEditing(false);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setErrors({ general: "Failed to save profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    setName(sessionUser?.name || "");
    setEmail(sessionUser?.email || "");
    // Reset to loaded profile data
    loadProfileData();
    setAvatarPreview(null);
    setIsEditing(false);
    setErrors({});
    setSaveSuccess(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({ avatar: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: "Image must be less than 5MB" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
      setIsUploading(false);
      setErrors({ ...errors, avatar: "" });
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Password change handlers
  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    // Only require current password if user already has one
    if (passwordStatus.requiresCurrentPassword && !currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (passwordStatus.requiresCurrentPassword && currentPassword === newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setErrors({});

    try {
      const requestBody: { newPassword: string; currentPassword?: string } = {
        newPassword,
      };

      // Only include current password if required
      if (passwordStatus.requiresCurrentPassword) {
        requestBody.currentPassword = currentPassword;
      }

      const response = await fetch("/api/profile/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ password: data.error || "Failed to change password" });
        return;
      }

      // Success
      setPasswordChangeSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);

      // Reload password status to update UI state
      loadPasswordStatus();

      // Hide success message after 3 seconds
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to change password:", error);
      setErrors({ password: "Failed to change password. Please try again." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(false);
    setErrors({});
  };

  // Delete account handlers
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== sessionUser?.email) {
      setErrors({ delete: "Email confirmation does not match your account email" });
      return;
    }

    setIsDeletingAccount(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ delete: data.error || "Failed to delete account" });
        return;
      }

      // Success - sign out and redirect
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Failed to delete account:", error);
      setErrors({ delete: "Failed to delete account. Please try again." });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeleteAccount = () => {
    setDeleteConfirmEmail("");
    setErrors({});
  };

  // Check if user can change password (now all users can)
  const canChangePassword = passwordStatus.canChangePassword;
  if (isLoadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90%] sm:max-w-4xl max-h-[90vh]">
          <DialogTitle className="sr-only">Profile Settings</DialogTitle>
          <div className="flex items-center justify-center py-8 sm:py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="ml-3 text-sm sm:text-base">Loading profile...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage your account information, avatar, and privacy preferences
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Success Messages */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Profile saved successfully!</span>
                </motion.div>
              )}
              
              {passwordChangeSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Password {passwordStatus.hasPassword ? "changed" : "set"} successfully!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error Messages */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.general}</span>
              </motion.div>
            )}
            
            {errors.password && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.password}</span>
              </motion.div>
            )}
            
            {errors.delete && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.delete}</span>
              </motion.div>
            )}

            {/* Profile Header with Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 py-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center gap-4 sm:gap-6 sm:flex-row sm:items-start">
                    {/* Avatar Section */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                        <AvatarImage
                          src={avatarPreview || session?.user?.image || ""}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-primary/20">
                          {getInitials(
                            name ||
                              session?.user?.name ||
                              session?.user?.email ||
                              "U"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing && (
                        <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 flex gap-1">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent rounded-full"
                              />
                            ) : (
                              <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>

                          {(avatarPreview || session?.user?.image) && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-lg"
                              onClick={handleRemoveAvatar}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        aria-label="Upload profile picture"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                          {name || session?.user?.name || "User"}
                        </h3>
                        <Button
                          variant={isEditing ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                          disabled={isSaving}
                          className="w-full sm:w-auto"
                        >
                          {isEditing ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Profile
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base">
                        {bio || "AI enthusiast and technology lover"}
                      </p>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                            Online
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">Joined {new Date(stats.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errors.avatar && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.avatar}</span>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your basic profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {renderFormField(
                    "Full Name",
                    name,
                    setName,
                    "Enter your full name",
                    "name",
                    "text",
                    true
                  )}
                  {renderFormField(
                    "Email Address",
                    email,
                    setEmail,
                    "Enter your email",
                    "email",
                    "email",
                    true
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bio</Label>
                    {isEditing ? (
                      <div>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className={cn(
                            "resize-none min-h-[60px] sm:min-h-[80px] transition-colors duration-200 text-sm sm:text-base",
                            bio.length >= 450 ? "border-amber-400" : ""
                          )}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                          rows={2}
                          disabled={isSaving}
                        />
                        <div className="flex justify-end mt-1">
                          <span className={cn(
                            "text-xs",
                            bio.length >= 450 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {bio.length}/500
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {bio || "No bio added"}
                      </div>
                    )}
                  </div>
                  
                  {renderFormField(
                    "Phone Number",
                    phone,
                    setPhone,
                    "+1 (555) 123-4567",
                    "phone",
                    "tel"
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Professional Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your work and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {renderFormField(
                    "Job Title",
                    jobTitle,
                    setJobTitle,
                    "Software Engineer"
                  )}
                  {renderFormField("Company", company, setCompany, "Acme Corp")}
                  {renderFormField(
                    "Location",
                    location,
                    setLocation,
                    "San Francisco, CA"
                  )}
                  {renderFormField(
                    "Website",
                    website,
                    setWebsite,
                    "https://yourwebsite.com",
                    "website",
                    "url"
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Privacy Settings */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Control what information is visible to others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Show Email</Label>
                    </div>
                    <Switch
                      checked={showEmail}
                      onCheckedChange={setShowEmail}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Show Phone</Label>
                    </div>
                    <Switch
                      checked={showPhone}
                      onCheckedChange={setShowPhone}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Show Location</Label>
                    </div>
                    <Switch
                      checked={showLocation}
                      onCheckedChange={setShowLocation}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Usage Statistics
                </CardTitle>
                <CardDescription className="text-sm">
                  Your activity with Lunara
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="ml-3 text-sm">Loading stats...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-3 sm:p-4 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="text-lg sm:text-2xl font-bold text-primary mb-1">
                        {stats.conversations}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Conversations
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-3 sm:p-4 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="text-lg sm:text-2xl font-bold text-primary mb-1">
                        {stats.messages}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Mail className="h-3 w-3" />
                        Messages
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-3 sm:p-4 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="text-lg sm:text-2xl font-bold text-primary mb-1">
                        {stats.chatTime}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Chat Time
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-3 sm:p-4 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="text-lg sm:text-2xl font-bold text-primary mb-1">
                        {stats.daysActive}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Days Active
                      </div>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Key className="h-4 w-4 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Change Password Section */}
                {canChangePassword && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Password</h4>
                        <p className="text-xs text-muted-foreground">
                          {passwordStatus.hasPassword 
                            ? "Change your account password" 
                            : passwordStatus.isGoogleUser 
                              ? "Set a password for your Google account" 
                              : "Set your account password"
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        disabled={isChangingPassword || isSaving}
                        className="text-sm"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {passwordStatus.hasPassword ? "Change Password" : "Set Password"}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showChangePassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                            {/* Current Password - Only show if user has existing password */}
                            {passwordStatus.requiresCurrentPassword && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Current Password <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className={cn(
                                      "pr-10 transition-colors duration-200",
                                      errors.currentPassword ? "border-destructive focus-visible:ring-destructive/20" : ""
                                    )}
                                    placeholder="Enter your current password"
                                    disabled={isChangingPassword}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    disabled={isChangingPassword}
                                  >
                                    {showCurrentPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {errors.currentPassword && (
                                  <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>{errors.currentPassword}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* New Password */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                {passwordStatus.hasPassword ? "New Password" : "Password"} <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className={cn(
                                    "pr-10 transition-colors duration-200",
                                    errors.newPassword ? "border-destructive focus-visible:ring-destructive/20" : ""
                                  )}
                                  placeholder={`Enter your ${passwordStatus.hasPassword ? "new " : ""}password`}
                                  disabled={isChangingPassword}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  disabled={isChangingPassword}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {errors.newPassword && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{errors.newPassword}</span>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Confirm {passwordStatus.hasPassword ? "New " : ""}Password <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className={cn(
                                    "pr-10 transition-colors duration-200",
                                    errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/20" : ""
                                  )}
                                  placeholder={`Confirm your ${passwordStatus.hasPassword ? "new " : ""}password`}
                                  disabled={isChangingPassword}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  disabled={isChangingPassword}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {errors.confirmPassword && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{errors.confirmPassword}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelPasswordChange}
                                disabled={isChangingPassword}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !newPassword || !confirmPassword || (passwordStatus.requiresCurrentPassword && !currentPassword)}
                              >
                                {isChangingPassword ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {passwordStatus.hasPassword ? "Changing..." : "Setting..."}
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {passwordStatus.hasPassword ? "Change Password" : "Set Password"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Delete Account Section */}
                <div className="space-y-3 pt-4 border-t border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm text-destructive">Delete Account</h4>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingAccount || isSaving}
                          className="text-sm"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Delete Account
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              This action cannot be undone. This will permanently delete your
                              account and remove all your data from our servers.
                            </p>
                            <p className="font-medium">
                              All of the following will be permanently deleted:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                              <li>Your profile and account information</li>
                              <li>All conversations and chat history</li>
                              <li>Preferences and settings</li>
                              <li>Usage statistics</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Type your email to confirm: <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="email"
                              value={deleteConfirmEmail}
                              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                              className={cn(
                                "transition-colors duration-200",
                                errors.delete ? "border-destructive focus-visible:ring-destructive/20" : ""
                              )}
                              placeholder={sessionUser?.email || ""}
                              disabled={isDeletingAccount}
                            />
                            {errors.delete && (
                              <div className="flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                <span>{errors.delete}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={handleCancelDeleteAccount} disabled={isDeletingAccount}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount || deleteConfirmEmail !== sessionUser?.email}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeletingAccount ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-end gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-background flex-shrink-0"
            >
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
