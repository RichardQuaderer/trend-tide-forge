import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Link as LinkIcon, Clock, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportVideoDialog({ open, onOpenChange }: ImportVideoDialogProps) {
  const [importMethod, setImportMethod] = useState<"upload" | "url">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const { toast } = useToast();

  const handleImport = () => {
    if (importMethod === "upload" && !videoFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to import",
        variant: "destructive"
      });
      return;
    }

    if (importMethod === "url" && !videoUrl.trim()) {
      toast({
        title: "No URL provided",
        description: "Please enter a video URL to import",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Video imported successfully! 🎉",
      description: "Processing your video for short-form conversion..."
    });

    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-primary" />
            <span>Import Long Video</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all ${
                importMethod === "upload" 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setImportMethod("upload")}
            >
              <CardContent className="p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Upload File</h3>
                <p className="text-sm text-muted-foreground">Upload from device</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                importMethod === "url" 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setImportMethod("url")}
            >
              <CardContent className="p-4 text-center">
                <LinkIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">From URL</h3>
                <p className="text-sm text-muted-foreground">YouTube, Vimeo, etc.</p>
              </CardContent>
            </Card>
          </div>

          {/* Import Content */}
          {importMethod === "upload" ? (
            <div className="space-y-4">
              <Label htmlFor="video-upload">Select Video File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {videoFile ? videoFile.name : "Drop your video here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • MP4, MOV, AVI up to 2GB
                  </p>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Tell us what parts to focus on, what style you want, or any specific requirements..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">What happens next?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI will analyze your video and extract the most engaging moments to create viral short-form content. Processing takes 2-5 minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Import & Process
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}