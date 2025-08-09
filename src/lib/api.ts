// Mock API layer with seeded demo data for the viral video maker

export interface Trend {
  id: string;
  hashtag?: string;
  sound?: string;
  thumbnail?: string;
  usage: number;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  status: 'Draft' | 'Generated' | 'Published';
  views: number;
  likes: number;
  shares: number;
  platforms: string[];
  createdAt: string;
}

export interface AnalyticsData {
  totalViews: number;
  avgWatchPercent: number;
  totalShares: number;
  bestHookCTR: number;
  dailyStats: Array<{
    date: string;
    views: number;
    likes: number;
    shares: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    views: number;
    percentage: number;
  }>;
  bestHook: string;
}

export interface UserProfile {
  id: string;
  goal: string;
  style: string;
  platforms: string[];
  trendiness: number;
  autoCaptions: boolean;
}

// Mock data
const mockTrends: Trend[] = [
  { id: '1', hashtag: 'viral', usage: 2400000 },
  { id: '2', hashtag: 'fyp', usage: 1800000 },
  { id: '3', hashtag: 'trending', usage: 1200000 },
  { id: '4', hashtag: 'creative', usage: 980000 },
  { id: '5', hashtag: 'aesthetic', usage: 750000 },
  { id: '6', sound: 'Epic Cinematic Beat', thumbnail: '/api/placeholder/80/80', usage: 450000 },
  { id: '7', sound: 'Trending Pop Hook', thumbnail: '/api/placeholder/80/80', usage: 380000 },
  { id: '8', sound: 'Viral Dance Track', thumbnail: '/api/placeholder/80/80', usage: 320000 },
  { id: '9', sound: 'Motivational Speech', thumbnail: '/api/placeholder/80/80', usage: 280000 },
  { id: '10', sound: 'Meme Sound Effect', thumbnail: '/api/placeholder/80/80', usage: 250000 },
];

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'How to go viral in 2024',
    thumbnail: '/api/placeholder/200/300',
    status: 'Published',
    views: 125000,
    likes: 8500,
    shares: 320,
    platforms: ['TikTok', 'Instagram'],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Secret productivity hack',
    thumbnail: '/api/placeholder/200/300',
    status: 'Generated',
    views: 0,
    likes: 0,
    shares: 0,
    platforms: [],
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    title: 'Morning routine that changed my life',
    thumbnail: '/api/placeholder/200/300',
    status: 'Draft',
    views: 0,
    likes: 0,
    shares: 0,
    platforms: [],
    createdAt: '2024-01-16',
  },
  {
    id: '4',
    title: 'AI tools everyone should know',
    thumbnail: '/api/placeholder/200/300',
    status: 'Published',
    views: 89000,
    likes: 5600,
    shares: 180,
    platforms: ['YouTube', 'TikTok'],
    createdAt: '2024-01-14',
  },
  {
    id: '5',
    title: 'Quick recipe for busy people',
    thumbnail: '/api/placeholder/200/300',
    status: 'Published',
    views: 67000,
    likes: 4200,
    shares: 95,
    platforms: ['Instagram', 'TikTok'],
    createdAt: '2024-01-13',
  },
  {
    id: '6',
    title: 'Fashion trends 2024',
    thumbnail: '/api/placeholder/200/300',
    status: 'Generated',
    views: 0,
    likes: 0,
    shares: 0,
    platforms: [],
    createdAt: '2024-01-16',
  },
];

const mockAnalytics: AnalyticsData = {
  totalViews: 281000,
  avgWatchPercent: 68,
  totalShares: 595,
  bestHookCTR: 12.5,
  dailyStats: [
    { date: '2024-01-10', views: 12000, likes: 800, shares: 45 },
    { date: '2024-01-11', views: 18000, likes: 1200, shares: 67 },
    { date: '2024-01-12', views: 25000, likes: 1800, shares: 89 },
    { date: '2024-01-13', views: 31000, likes: 2100, shares: 95 },
    { date: '2024-01-14', views: 28000, likes: 1900, shares: 82 },
    { date: '2024-01-15', views: 35000, likes: 2400, shares: 120 },
    { date: '2024-01-16', views: 22000, likes: 1500, shares: 68 },
  ],
  platformBreakdown: [
    { platform: 'TikTok', views: 168600, percentage: 60 },
    { platform: 'Instagram', views: 84300, percentage: 30 },
    { platform: 'YouTube', views: 28100, percentage: 10 },
  ],
  bestHook: "Wait for it... this will blow your mind 🤯",
};

// API functions with simulated delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Get trending hashtags and sounds
  async getTrends(): Promise<Trend[]> {
    await delay(500);
    return mockTrends;
  },

  // Get user's videos
  async getVideos(): Promise<Video[]> {
    await delay(300);
    return mockVideos;
  },

  // Get analytics data
  async getAnalytics(): Promise<AnalyticsData> {
    await delay(600);
    return mockAnalytics;
  },

  // Improve script with AI
  async improveScript(script: string): Promise<{ improvedScript: string; hookSuggestions: string[] }> {
    await delay(1200);
    return {
      improvedScript: `${script}\n\n[AI Enhanced]: Added engaging hooks and optimized for viral potential.`,
      hookSuggestions: [
        "You won't believe what happened next...",
        "This changed everything for me",
        "POV: You discover the secret that...",
      ],
    };
  },

  // Generate video
  async generateVideo(script: string, settings: any): Promise<{ videoId: string; status: string }> {
    await delay(3000);
    const videoId = `video_${Date.now()}`;
    return {
      videoId,
      status: 'generated',
    };
  },

  // Publish to platforms
  async publishVideo(videoId: string, platforms: string[], metadata: any): Promise<{ success: boolean; results: any[] }> {
    await delay(2000);
    return {
      success: true,
      results: platforms.map(platform => ({
        platform,
        status: 'published',
        url: `https://${platform.toLowerCase()}.com/video/${videoId}`,
      })),
    };
  },

  // Save user profile
  async saveProfile(profile: UserProfile): Promise<{ success: boolean }> {
    await delay(500);
    localStorage.setItem('user_profile', JSON.stringify(profile));
    return { success: true };
  },

  // Get user profile
  async getProfile(): Promise<UserProfile | null> {
    await delay(200);
    const stored = localStorage.getItem('user_profile');
    return stored ? JSON.parse(stored) : null;
  },
};