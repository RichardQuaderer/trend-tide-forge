import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Palette, 
  Share2, 
  Sliders, 
  Captions,
  Play,
  Youtube,
  Instagram,
  ArrowRight,
  ArrowLeft,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, UserProfile } from "@/lib/api";

const steps = [
  { id: 1, title: "Your Goal", icon: Target },
  { id: 2, title: "Style Preference", icon: Palette },
  { id: 3, title: "Platforms & Settings", icon: Share2 },
  { id: 4, title: "Connect Accounts", icon: Check },
];

const goals = [
  { id: "followers", label: "Grow Followers", desc: "Build audience and engagement" },
  { id: "product", label: "Promote Product", desc: "Drive sales and awareness" },
  { id: "knowledge", label: "Share Knowledge", desc: "Educate and inspire" },
  { id: "fun", label: "Just for Fun", desc: "Creative expression and joy" },
];

const styles = [
  { id: "meme", label: "Meme", desc: "Funny, relatable content", color: "bg-creator-orange" },
  { id: "cinematic", label: "Cinematic", desc: "High-quality, dramatic", color: "bg-creator-purple" },
  { id: "fast-cut", label: "Fast-cut", desc: "Quick, energetic editing", color: "bg-creator-pink" },
  { id: "explainer", label: "Explainer", desc: "Educational, clear", color: "bg-creator-blue" },
  { id: "product", label: "Product Showcase", desc: "Professional, commercial", color: "bg-creator-purple" },
];

const platforms = [
  { id: "tiktok", label: "TikTok", icon: Play, color: "text-black" },
  { id: "youtube", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
  { id: "instagram", label: "Instagram Reels", icon: Instagram, color: "text-pink-500" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    goal: "",
    style: "",
    platforms: [],
    trendiness: 70,
    autoCaptions: true,
  });

  const progress = (currentStep / steps.length) * 100;

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handlePlatformToggle = (platformId: string) => {
    const platforms = profile.platforms || [];
    const updated = platforms.includes(platformId)
      ? platforms.filter(p => p !== platformId)
      : [...platforms, platformId];
    updateProfile({ platforms: updated });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await api.saveProfile(profile as UserProfile);
      navigate('/home');
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!profile.goal;
      case 2: return !!profile.style;
      case 3: return profile.platforms && profile.platforms.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Let's Get Started</h1>
          <p className="text-muted-foreground mb-6">Customize your viral video experience</p>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex items-center space-x-1">
                    <StepIcon className={`w-4 h-4 ${currentStep > index ? 'text-primary' : ''}`} />
                    <span className={currentStep > index ? 'text-primary font-medium' : ''}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-creator-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {steps[currentStep - 1] && (
                    <>
                      {(() => {
                        const StepIcon = steps[currentStep - 1].icon;
                        return <StepIcon className="w-5 h-5 text-primary" />;
                      })()}
                      <span>{steps[currentStep - 1].title}</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Goal Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">What's your main goal with video content?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {goals.map((goal) => (
                        <Card
                          key={goal.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-creator ${
                            profile.goal === goal.id ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                          onClick={() => updateProfile({ goal: goal.id })}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1">{goal.label}</h3>
                            <p className="text-sm text-muted-foreground">{goal.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Style Selection */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Which style resonates with you?</p>
                    <div className="space-y-3">
                      {styles.map((style) => (
                        <Card
                          key={style.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-creator ${
                            profile.style === style.id ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                          onClick={() => updateProfile({ style: style.id })}
                        >
                          <CardContent className="p-4 flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl ${style.color} flex items-center justify-center`}>
                              <Palette className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{style.label}</h3>
                              <p className="text-sm text-muted-foreground">{style.desc}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Platforms & Settings */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-muted-foreground mb-4">Which platforms do you want to post on?</p>
                      <div className="space-y-3">
                        {platforms.map((platform) => (
                          <Card
                            key={platform.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-creator ${
                              profile.platforms?.includes(platform.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                            onClick={() => handlePlatformToggle(platform.id)}
                          >
                            <CardContent className="p-4 flex items-center space-x-4">
                              <platform.icon className={`w-8 h-8 ${platform.color}`} />
                              <div className="flex-1">
                                <h3 className="font-semibold">{platform.label}</h3>
                              </div>
                              <Checkbox
                                checked={profile.platforms?.includes(platform.id)}
                                disabled
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Trendiness Level</label>
                        <Slider
                          value={[profile.trendiness || 70]}
                          onValueChange={(value) => updateProfile({ trendiness: value[0] })}
                          max={100}
                          step={10}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Safe & Classic</span>
                          <span>Max Viral Potential</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Auto-add Captions</label>
                          <p className="text-xs text-muted-foreground">Automatically generate captions for accessibility</p>
                        </div>
                        <Switch
                          checked={profile.autoCaptions}
                          onCheckedChange={(checked) => updateProfile({ autoCaptions: checked })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Social Connect */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Connect Your Accounts</h3>
                      <p className="text-muted-foreground mb-6">
                        Connect your social accounts to enable direct publishing
                      </p>
                    </div>

                    <div className="space-y-3">
                      {platforms
                        .filter(p => profile.platforms?.includes(p.id))
                        .map((platform) => (
                        <Card key={platform.id} className="hover:shadow-creator transition-all duration-200">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <platform.icon className={`w-6 h-6 ${platform.color}`} />
                              <span className="font-medium">{platform.label}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              Connect
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="text-center">
                      <Badge variant="secondary" className="px-4 py-2">
                        You can skip this step and connect later
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center space-x-2 gradient-primary text-white"
          >
            <span>{currentStep === steps.length ? 'Finish' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}