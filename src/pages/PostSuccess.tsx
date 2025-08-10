import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Youtube } from 'lucide-react';
import { useState } from 'react';

export default function PostSuccess() {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const videoUrl: string | undefined = location.state?.videoUrl;
  const videoLink: string = location.state?.videoLink || 'https://youtu.be/abc123def';
  const caption: string = location.state?.caption || 'Your engaging caption with emojis ✨🚀';
  const title: string = location.state?.title || 'Uploaded Video';

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(videoLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl md:text-3xl font-bold">Video successfully uploaded</h1>
      </div>

      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            YouTube Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            {videoUrl ? (
              <video controls className="w-full bg-black">
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-black text-white text-sm">No video preview</div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{caption}</p>
          </div>

          <div className="flex items-center gap-2">
            <Input readOnly value={videoLink} className="text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a href={videoLink} target="_blank" rel="noreferrer">
              <Button>View on YouTube</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/prepare')}>Back</Button>
        <Button onClick={() => navigate('/home')}>Go to Home</Button>
      </div>
    </div>
  );
} 