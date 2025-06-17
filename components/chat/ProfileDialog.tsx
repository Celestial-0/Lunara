"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser, UserStats } from "@/types/types";

// Reusable Tailwind class combinations
const cardStyles = {
  statCard: "text-center p-3 sm:p-4 rounded-xl border bg-primary/5 transition hover:bg-primary/10 hover:shadow-sm",
  settingRow: "flex items-center justify-between p-3 rounded-xl border hover:bg-accent/50 transition",
  flexCenter: "flex items-center justify-center",
  flexCenterBetween: "flex items-center justify-between",
  flexRow: "flex flex-row items-center gap-x-2",
  flexCol: "flex flex-col gap-y-2", 
  iconText: "flex items-center gap-x-2",
  formField: "space-y-2",
  responsiveText: "text-sm sm:text-base",
  buttonIcon: "size-4",
  roundedInput: "rounded-xl focus:ring-primary/20 focus:ring-2",
  animatedCard: "transition-all duration-200 ease-in-out",
  statusIndicator: "size-2 rounded-full",
  contentSection: "space-y-4",
};

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
  // Load profile data when dialog opens
  useEffect(() => {
    if (open && sessionUser?.id) {
      loadProfileData();
      loadUserStats();
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
      <div className={cardStyles.formField}>
        <label className="text-sm font-medium flex items-center gap-x-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {isEditing ? (
          <div className="space-y-1">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={cn(
                cardStyles.roundedInput,
                "transition-colors duration-200",
                errorKey && errors[errorKey] ? "border-destructive ring-destructive/20" : "focus:border-primary/50"
              )}
              type={type}
              placeholder={placeholder}
              disabled={isSaving}
            />
            {errorKey && errors[errorKey] && (
              <p className="text-xs text-destructive flex items-center gap-x-1">
                <AlertCircle className="size-3" />
                <span>{errors[errorKey]}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-1.5 px-2 rounded bg-muted/40">{value || "Not set"}</p>
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
  if (isLoadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">Profile Settings</DialogTitle>
          <ScrollArea >
            <div className="flex items-center justify-center py-12 px-4 sm:px-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2  border-t-transparent rounded-full"
              />
              <span className="ml-3">Loading profile...</span>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl px-2 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 space-y-3">
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Manage your account information, avatar, and privacy preferences
          </DialogDescription>
        </DialogHeader>{" "}
        <ScrollArea
          className="flex overflow-y-auto rounded-md   
          [scrollbar-width:thin]
          [scrollbar-color:var(--scrollbar-thumb) transparent]"
        >
          <div className="space-y-4 sm:space-y-6 py-3 px-4 sm:px-6">
            {/* Success Message */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 rounded-xl text-green-600 bg-green-100 dark:bg-green-900/20"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Profile saved successfully!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error Message */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 rounded-xl text-destructive bg-destructive/10 dark:bg-destructive/20"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.general}</span>
              </motion.div>
            )}

            {/* Profile Header with Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {" "}
              <div className="p-4 sm:p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="size-20 sm:size-24 border-4 border-background shadow-lg ring-2 ring-primary/10 hover:ring-primary/20 transition">
                      <AvatarImage
                        src={avatarPreview || session?.user?.image || ""}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className="text-lg sm:text-2xl font-semibold bg-primary/20"
                      >
                        {getInitials(
                          name ||
                            session?.user?.name ||
                            session?.user?.email ||
                            "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-8 rounded-full shadow-lg hover:shadow-md hover:bg-secondary/80 transition-all"
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
                              className="size-4 border-2 border-primary border-t-transparent rounded-full"
                            />
                          ) : (
                            <Camera className="size-4" />
                          )}
                        </Button>

                        {(avatarPreview || session?.user?.image) && (
                          <Button
                            size="icon"
                            variant="destructive"
                            className="size-8 rounded-full shadow-lg hover:shadow-md hover:bg-destructive/90 transition-all"
                            onClick={handleRemoveAvatar}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      aria-label="Upload profile picture"
                      title="Upload profile picture"
                      className="hidden"
                    />
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {name || session?.user?.name || "User"}
                      </h3>
                      <Button
                        variant={isEditing ? "destructive" : "outline"}
                        size="sm"
                        onClick={() =>
                          isEditing ? handleCancel() : setIsEditing(true)
                        }
                        className={cn(
                          cardStyles.roundedInput,
                          "w-full sm:w-auto transition-colors"
                        )}
                        disabled={isSaving}
                      >
                        {isEditing ? (
                          <>
                            <X className={cardStyles.buttonIcon} />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit2 className={cardStyles.buttonIcon} />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>

                    <p
                      className={cn(
                        "text-muted-foreground mb-3",
                        cardStyles.responsiveText,
                        "line-clamp-3"
                      )}
                    >
                      {bio || "AI enthusiast and technology lover"}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 sm:gap-x-4 text-sm text-muted-foreground">
                      <div className={cn(cardStyles.flexCenter, "sm:justify-start gap-x-1")}>
                        <div className={cn(cardStyles.statusIndicator, "bg-green-500 animate-pulse")} />
                        <span className="text-green-600 font-medium">
                          Online
                        </span>
                      </div>
                      <div className={cn(cardStyles.iconText, "sm:justify-start text-muted-foreground/80")}>
                        <Calendar className="size-4" />
                        <span>
                          Joined {new Date(stats.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {errors.avatar && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-4 p-2 rounded-md bg-destructive/10",
                      cardStyles.iconText,
                      "text-destructive text-sm"
                    )}
                  >
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{errors.avatar}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Personal Information */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-4">
                  <CardTitle
                    className={cn(cardStyles.iconText, "text-base sm:text-lg font-semibold")}
                  >
                    <User className="size-4 text-primary" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground/80">
                    Your basic profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className={cardStyles.contentSection}>
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
                  )}{" "}
                  <div className={cardStyles.formField}>
                    <label className="text-sm font-medium">Bio</label>
                    {isEditing ? (
                      <div>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className={cn(
                            cardStyles.roundedInput, 
                            "resize-none min-h-[80px] transition-colors duration-200 focus:border-primary/50",
                            bio.length >= 450 ? "border-amber-400" : ""
                          )}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                          rows={3}
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
                      <p className="text-sm text-muted-foreground bg-muted/40 p-2 rounded-lg">
                        {bio || "No bio added"}
                      </p>
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
                <CardHeader className="pb-4">
                  {" "}
                  <CardTitle
                    className={cn(cardStyles.iconText, "text-base sm:text-lg")}
                  >
                    <Briefcase className="size-4" />
                    <span>Professional Information</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your work and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
              <CardHeader className="pb-4">
                {" "}
                <CardTitle
                  className={cn(cardStyles.iconText, "text-base sm:text-lg")}
                >
                  <Shield className="size-4" />
                  <span>Privacy Settings</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Control what information is visible to others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {" "}
                  <div className={cardStyles.settingRow}>
                    <div className={cardStyles.iconText}>
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="text-sm">Show Email</span>
                    </div>
                    <Switch
                      checked={showEmail}
                      onCheckedChange={setShowEmail}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  <div className={cardStyles.settingRow}>
                    <div className={cardStyles.iconText}>
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="text-sm">Show Phone</span>
                    </div>
                    <Switch
                      checked={showPhone}
                      onCheckedChange={setShowPhone}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  <div className={cardStyles.settingRow}>
                    <div className={cardStyles.iconText}>
                      <MapPin className="size-4 text-muted-foreground" />
                      <span className="text-sm">Show Location</span>
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
              <CardHeader className="pb-4">
                {" "}
                <CardTitle className={cn("text-base sm:text-lg")}>
                  Usage Statistics
                </CardTitle>
                <CardDescription className="text-sm">
                  Your activity with Lunara
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className={cn(cardStyles.flexCenter, "py-8")}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="size-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="ml-3 text-sm">Loading stats...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cardStyles.statCard}
                    >
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {stats.conversations}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Conversations
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cardStyles.statCard}
                    >
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {stats.messages}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Messages
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cardStyles.statCard}
                    >
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {stats.chatTime}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Chat Time
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cardStyles.statCard}
                    >
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {stats.daysActive}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Days Active
                      </div>{" "}
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        {/* Action Buttons - Outside ScrollArea for accessibility */}
        
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-end gap-3 pb-3 pr-3"
            >
              <Button
                onClick={handleSave}
                className="rounded-lg px-6 py-2 w-fit"
                disabled={isSaving}
              >
                <span className="flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
