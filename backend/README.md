# Trend Tide Forge Backend

This backend service fetches trending YouTube videos using the YouTube Data API and provides them to the frontend application.

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the project root with your YouTube API key:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

To get a YouTube API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Copy the API key to your `.env` file

### 3. Run the Backend

```bash
# Run backend only
cd backend
python app.py

# Or run both frontend and backend together
npm run dev:fullstack
```

## API Endpoints

### GET /api/health

Health check endpoint

- Returns: `{"status": "healthy", "timestamp": "...", "service": "trend-tide-forge-backend"}`

### GET /api/trending-videos

Fetch trending YouTube videos

- Query Parameters:
  - `region` (optional): Region code (default: "US")
  - `max_results` (optional): Number of videos (default: 10, max: 50)
  - `category_id` (optional): Video category filter
- Returns: List of trending videos with metadata

### GET /api/trending-videos/cached

Get cached trending videos

- Query Parameters:
  - `region` (optional): Region code (default: "US")
- Returns: Most recently cached videos for the region

### POST /api/trending-videos/refresh

Refresh trending videos data

- Body: `{"region": "US", "max_results": 25}`
- Returns: Fresh trending videos data

### GET /api/regions

Get supported region codes

- Returns: List of supported regions with codes and names

## Features

- Fetches real-time trending YouTube videos
- Supports multiple regions (US, GB, CA, AU, DE, FR, JP, IN, etc.)
- Automatic data caching with formatted JSON output
- Error handling and fallback to cached data
- CORS enabled for frontend integration
- Health monitoring endpoint

## Data Storage

The backend automatically saves fetched data to JSON files in the `trend_results/` directory for caching and offline access.

## Error Handling

- API failures automatically fall back to cached data
- Comprehensive error logging
- Graceful degradation when YouTube API is unavailable
