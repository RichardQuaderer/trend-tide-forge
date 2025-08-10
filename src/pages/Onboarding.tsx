import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Palette, Share2, Sliders, Captions, Play, Youtube, Instagram, ArrowRight, ArrowLeft, Check, Building, Upload, Users, Smile, Camera, Zap, GraduationCap, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, UserProfile } from "@/lib/api";
import { ConnectPlatformsStep } from "@/components/onboarding/ConnectPlatformsStep";
const steps = [{
  id: 1,
  title: "Business Goal",
  icon: Target
}, {
  id: 2,
  title: "Company Info",
  icon: Building
}, {
  id: 3,
  title: "Target Audience",
  icon: Users
}, {
  id: 4,
  title: "Connect Platforms",
  icon: Share2
}];
const goals = [{
  id: "brand-awareness",
  label: "Brand Awareness",
  desc: "Increase brand visibility and recognition"
}, {
  id: "promote-product",
  label: "Promote Product",
  desc: "Drive sales and product awareness"
}, {
  id: "generate-leads",
  label: "Generate Leads",
  desc: "Capture potential customers"
}, {
  id: "trying-out",
  label: "Just Trying Out",
  desc: "Exploring video marketing potential"
}];
const platforms = [{
  id: "tiktok",
  label: "TikTok",
  icon: Play,
  color: "text-black"
}, {
  id: "youtube",
  label: "YouTube Shorts",
  icon: Youtube,
  color: "text-red-500"
}, {
  id: "instagram",
  label: "Instagram Reels",
  icon: Instagram,
  color: "text-pink-500"
}];
export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    goal: "",
    companyUrl: "",
    companyLogo: null,
    targetAudience: "",
    platforms: []
  });
  const progress = currentStep / steps.length * 100;
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
  };
  const handlePlatformToggle = (platformId: string) => {
    const platforms = profile.platforms || [];
    const updated = platforms.includes(platformId) ? platforms.filter(p => p !== platformId) : [...platforms, platformId];
    updateProfile({
      platforms: updated
    });
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
      case 1:
        return !!profile.goal;
      case 2:
        return !!profile.companyUrl;
      case 3:
        return !!profile.targetAudience;
      case 4:
        return profile.platforms && profile.platforms.length > 0;
      default:
        return false;
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center px-4 py-8">
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
              return <div key={step.id} className="flex items-center space-x-1">
                    <StepIcon className={`w-4 h-4 ${currentStep > index ? 'text-primary' : ''}`} />
                    <span className={currentStep > index ? 'text-primary font-medium' : ''}>
                      {step.title}
                    </span>
                  </div>;
            })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.3
        }}>
            <Card className="shadow-runway-lg card-runway">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-tight">
                  {steps[currentStep - 1] && <>
                      {(() => {
                    const StepIcon = steps[currentStep - 1].icon;
                    return <StepIcon className="w-5 h-5 text-primary" />;
                  })()}
                      <span>{steps[currentStep - 1].title}</span>
                    </>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Business Goal */}
                {currentStep === 1 && <div className="space-y-4">
                    <p className="text-muted-foreground">What's your main business goal with video content?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {goals.map(goal => <Card key={goal.id} className={`cursor-pointer transition-all duration-200 hover:shadow-runway card-runway ${profile.goal === goal.id ? 'ring-2 ring-primary bg-primary/10' : ''}`} onClick={() => updateProfile({
                    goal: goal.id
                  })}>
                          <CardContent className="p-6">
                            <h3 className="font-semibold mb-2">{goal.label}</h3>
                            <p className="text-sm text-muted-foreground">{goal.desc}</p>
                          </CardContent>
                        </Card>)}
                    </div>
                  </div>}

                {/* Step 2: Company Information */}
                {currentStep === 2 && <div className="space-y-6">
                    <p className="text-muted-foreground">Tell us about your company to create better targeted videos.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="companyUrl" className="text-sm font-medium">Company Website *</Label>
                        <Input id="companyUrl" placeholder="https://yourcompany.com" value={profile.companyUrl || ""} onChange={e => updateProfile({
                      companyUrl: e.target.value
                    })} className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="companyLogo" className="text-sm font-medium">Company Logo (Optional)</Label>
                        <div className="mt-1 flex items-center space-x-4">
                          <Input id="companyLogo" type="file" accept="image/*" onChange={e => updateProfile({
                        companyLogo: e.target.files?.[0] || null
                      })} className="flex-1" />
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  </div>}

                {/* Step 3: Target Audience */}
                {currentStep === 3 && <div className="space-y-6">
                    <div>
                      <p className="text-muted-foreground mb-4">Who is your target audience? Our AI will analyze how to best reach them.</p>
                      
                      <div>
                        <Label htmlFor="targetAudience" className="text-sm font-medium">Target Audience *</Label>
                        <Textarea id="targetAudience" placeholder="e.g., Young professionals aged 25-35 interested in productivity tools, working in tech companies..." value={profile.targetAudience || ""} onChange={e => updateProfile({
                      targetAudience: e.target.value
                    })} rows={4} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Describe demographics, interests, behaviors, or any relevant details about your ideal customers.
                        </p>
                      </div>
                    </div>
                  </div>}

                {/* Step 4: Connect Platforms */}
                {currentStep === 4 && <ConnectPlatformsStep 
                    platforms={platforms}
                    profile={profile}
                    handlePlatformToggle={handlePlatformToggle}
                  />}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <Button onClick={nextStep} disabled={!canProceed()} className="flex items-center space-x-2">
            <span>{currentStep === steps.length ? 'Finish' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>;
}