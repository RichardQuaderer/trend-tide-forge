import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Play, TrendingUp, Users, Package, GraduationCap, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: any) => void;
}

const templates = [
  {
    id: 1,
    title: "Problem → Solution Hook",
    category: "viral",
    description: "Start with a relatable problem, then reveal your solution",
    preview: "/api/placeholder/160/90",
    structure: "Are you still [PROBLEM]? Here's what changed my life...",
    engagement: "15.2%",
    views: "2.4M",
    icon: TrendingUp
  },
  {
    id: 2,
    title: "Day in My Life",
    category: "lifestyle",
    description: "Behind-the-scenes content that builds personal connection",
    preview: "/api/placeholder/160/90",
    structure: "6AM morning routine → Work highlights → Evening wind down",
    engagement: "12.8%",
    views: "1.8M",
    icon: Users
  },
  {
    id: 3,
    title: "Product Showcase",
    category: "business",
    description: "Highlight your product's best features and benefits",
    preview: "/api/placeholder/160/90",
    structure: "Here's why [PRODUCT] is game-changing → 3 key features → Results",
    engagement: "9.7%",
    views: "950K",
    icon: Package
  },
  {
    id: 4,
    title: "Educational Explainer",
    category: "educational",
    description: "Teach something valuable in under 60 seconds",
    preview: "/api/placeholder/160/90",
    structure: "Did you know [FACT]? → Explanation → Practical tip",
    engagement: "18.3%",
    views: "3.1M",
    icon: GraduationCap
  },
  {
    id: 5,
    title: "Quick Tips",
    category: "viral",
    description: "Fast-paced, actionable advice that viewers can implement",
    preview: "/api/placeholder/160/90",
    structure: "5 tips that will [BENEFIT] → Rapid-fire delivery → Call to action",
    engagement: "14.6%",
    views: "2.2M",
    icon: Zap
  },
  {
    id: 6,
    title: "Before & After",
    category: "transformation",
    description: "Show dramatic transformation or improvement",
    preview: "/api/placeholder/160/90",
    structure: "This is how [BEFORE] → What I changed → Amazing results",
    engagement: "16.9%",
    views: "2.7M",
    icon: TrendingUp
  }
];

const categories = [
  { id: "all", label: "All Templates" },
  { id: "viral", label: "Viral" },
  { id: "business", label: "Business" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "educational", label: "Educational" },
  { id: "transformation", label: "Transformation" }
];

export function TemplatesDialog({ open, onOpenChange, onSelectTemplate }: TemplatesDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: any) => {
    onSelectTemplate(template);
    toast({
      title: "Template selected! ✨",
      description: `Using "${template.title}" template structure`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Browse Video Templates</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Badge>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-creator transition-all group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Preview */}
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        <img
                          src={template.preview}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">{template.title}</h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>

                        <div className="text-xs bg-muted/50 p-2 rounded">
                          <strong>Structure:</strong> {template.structure}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{template.views} avg views</span>
                          <span className="text-green-600">{template.engagement} engagement</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}