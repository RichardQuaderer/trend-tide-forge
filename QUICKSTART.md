# Quick Start Guide

## Running the Application

### Option 1: Run Both Frontend and Backend Together

```bash
# Install frontend dependencies (if not done)
npm install

# Install backend dependencies
npm run install:backend

# Run both frontend and backend
npm run dev:fullstack
```

### Option 2: Run Separately

**Frontend (React + Vite):**

```bash
npm run dev
# Frontend will be available at http://localhost:3000
```

**Backend (Python Flask):**

```bash
cd backend
python app.py
# Backend will be available at http://localhost:5000
```

## What You'll See

1. **Frontend**: React application with trending videos section
2. **Backend**: Python API serving YouTube trending videos
3. **Integration**: Real-time data from YouTube displayed on the homepage

## Features Working

✅ **YouTube Trending Videos**: Fetches real trending videos from YouTube API
✅ **Multiple Regions**: Support for US, GB, CA, AU, DE, FR, JP, IN, etc.
✅ **Caching**: Automatic data caching for offline access
✅ **Error Handling**: Graceful fallback to cached data when API fails
✅ **Real-time Updates**: Refresh button to get latest trending videos
✅ **Visual Indicators**: Loading states, error messages, backend status

## API Key Status

Your `.env` file already contains a YouTube API key. The backend will use this automatically.

## Troubleshooting

If you see "Backend offline" or no trending videos:

1. **Check if backend is running**: Look for "Backend offline" badge
2. **Verify API key**: Make sure `YOUTUBE_API_KEY` in `.env` is valid
3. **Check terminal**: Look for error messages in backend terminal
4. **Try refresh**: Click the "Refresh" button in the trending videos section

## File Structure

```
trend-tide-forge/
├── src/pages/Home.tsx          # Homepage with trending videos
├── src/lib/api.ts              # API client with YouTube functions
├── backend/app.py              # Flask backend server
├── backend/trend_retrieval.py  # Your existing YouTube fetching logic
└── .env                        # API keys (already configured)
```
