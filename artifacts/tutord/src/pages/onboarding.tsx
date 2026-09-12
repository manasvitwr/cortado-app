import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button, Input, Textarea } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_INTERESTS = [
  "Web Development", "Data Science", "Design", "Machine Learning", 
  "Productivity", "Finance", "Music Production", "Filmmaking", 
  "History", "Math", "Physics", "Cooking"
];

export default function Onboarding() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      if (profile.onboardingCompleted) {
        setLocation("/home");
      } else {
        setUsername(profile.username || "");
        setRealName(profile.realName || "");
        setBio(profile.bio || "");
        setInterests(profile.interests || []);
      }
    }
  }, [profile, setLocation]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3 || username.length > 24) {
      setError("Username must be between 3 and 24 characters.");
      return;
    }

    try {
      const savedProfile = await updateProfile.mutateAsync({
        data: {
          username,
          realName: realName.trim() || null,
          ...(realName.trim() ? { displayName: realName.trim() } : {}),
          bio: bio || null,
          interests,
          onboardingCompleted: true
        }
      });
      queryClient.setQueryData(getGetProfileQueryKey(), savedProfile);
      toast({ title: "Welcome to Cortado!" });
      setLocation("/home");
    } catch (err: any) {
      if (err?.status === 409) {
        setError("That username is already taken. Please choose another.");
      } else {
        setError("Failed to save profile. Please try again.");
      }
    }
  };

  const handleSkip = async () => {
    try {
      const savedProfile = await updateProfile.mutateAsync({
        data: { onboardingCompleted: true }
      });
      queryClient.setQueryData(getGetProfileQueryKey(), savedProfile);
      toast({ title: "Welcome to Cortado!" });
      setLocation("/home");
    } catch (err) {
      toast({ title: "Error", description: "Failed to skip onboarding.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-card border border-border rounded-[2rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-8">
          <img src="/cortado-logo.png" alt="Cortado" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">Complete your profile</h1>
        <p className="text-muted-foreground text-center mb-8 font-medium">Tell us a bit about yourself and what you like to learn.</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Username <span className="text-destructive">*</span></label>
            <Input 
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. learning_junkie"
              className="h-12 bg-input border-border rounded-xl text-base"
              required
              minLength={3}
              maxLength={24}
            />
            <p className="text-xs text-muted-foreground font-medium mt-1">Only lowercase letters, numbers, and underscores.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Name <span className="text-muted-foreground font-medium">(Optional)</span></label>
            <Input 
              value={realName}
              onChange={e => setRealName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="h-12 bg-input border-border rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Short Bio <span className="text-muted-foreground font-medium">(Optional)</span></label>
            <Textarea 
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="I'm a self-taught developer looking to..."
              className="min-h-[100px] resize-none bg-input border-border rounded-xl text-base p-4"
              maxLength={120}
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-foreground">What do you learn on YouTube?</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_INTERESTS.map(interest => {
                const selected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                      selected 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" 
                        : "bg-input border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {selected && <Check className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />}
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="h-14 sm:w-1/3 rounded-xl font-bold border-border hover:bg-secondary text-base"
              onClick={handleSkip}
              disabled={updateProfile.isPending}
            >
              Skip
            </Button>
            <Button 
              type="submit" 
              className="h-14 sm:w-2/3 rounded-xl font-bold shadow-xl shadow-primary/20 text-base"
              isLoading={updateProfile.isPending}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
