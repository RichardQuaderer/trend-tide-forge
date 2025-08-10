from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime
from pathlib import Path
import logging

# Import your existing modules
from trend_retrieval import fetch_youtube_trending_videos
from trend_result_formatter import TrendResultFormatter

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the formatter
formatter = TrendResultFormatter()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'trend-tide-forge-backend'
    })

@app.route('/api/trending-videos', methods=['GET'])
def get_trending_videos():
    """Fetch and return trending YouTube videos"""
    try:
        # Get query parameters
        region_code = request.args.get('region', 'US')
        max_results = int(request.args.get('max_results', 10))
        category_id = request.args.get('category_id', None)
        
        # Validate parameters
        if max_results > 50:
            max_results = 50
        
        logger.info(f"Fetching trending videos for region: {region_code}, max_results: {max_results}")
        
        # Fetch trending videos using your existing function
        videos = fetch_youtube_trending_videos(
            region_code=region_code,
            max_results=max_results,
            video_category_id=category_id,
            include_captions=False  # Set to True if you want captions
        )
        
        # Format the videos for frontend consumption
        formatted_videos = []
        for video in videos:
            # Debug log to see the video data structure
            logger.debug(f"Processing video data: {video.keys()}")
            logger.debug(f"View count: {video.get('viewCount', 'NOT_FOUND')}")
            logger.debug(f"Like count: {video.get('likeCount', 'NOT_FOUND')}")
            logger.debug(f"Comment count: {video.get('commentCount', 'NOT_FOUND')}")
            
            formatted_video = {
                'id': video.get('id', ''),
                'title': video.get('title', ''),
                'channelTitle': video.get('channelTitle', ''),
                'thumbnail': video.get('thumbnails', {}).get('medium', {}).get('url', '') or video.get('thumbnails', {}).get('high', {}).get('url', ''),
                'views': int(video.get('viewCount', 0)),
                'publishedAt': video.get('publishedAt', ''),
                'platform': 'YouTube',
                'description': video.get('description', ''),
                'duration': video.get('duration', ''),
                'tags': video.get('tags', []),
                'categoryId': video.get('categoryId', ''),
                'likeCount': int(video.get('likeCount', 0)),
                'commentCount': int(video.get('commentCount', 0))
            }
            formatted_videos.append(formatted_video)
        
        # Save the data using your formatter
        formatted_result = formatter.format_youtube_videos(videos, region_code)
        save_path = formatter.save_to_json(formatted_result, f"trending_videos_{region_code}")
        
        logger.info(f"Successfully fetched {len(formatted_videos)} videos, saved to {save_path}")
        
        return jsonify({
            'videos': formatted_videos,
            'metadata': {
                'count': len(formatted_videos),
                'region': region_code,
                'timestamp': datetime.now().isoformat(),
                'saved_path': str(save_path)
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching trending videos: {str(e)}")
        return jsonify({
            'error': f'Failed to fetch trending videos: {str(e)}'
        }), 500

@app.route('/api/trending-videos/cached', methods=['GET'])
def get_cached_trending_videos():
    """Return cached trending videos if available"""
    try:
        region_code = request.args.get('region', 'US')
        
        # Look for the most recent cached file
        cache_pattern = f"trending_videos_{region_code}*.json"
        cache_files = list(formatter.output_dir.glob(cache_pattern))
        
        if not cache_files:
            return jsonify({
                'error': 'No cached data available',
                'message': 'Please fetch new data first'
            }), 404
        
        # Get the most recent file
        latest_file = max(cache_files, key=os.path.getctime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
        
        logger.info(f"Serving cached data from {latest_file}")
        
        return jsonify({
            'videos': cached_data.get('videos', []),
            'metadata': {
                **cached_data.get('metadata', {}),
                'cached': True,
                'cache_file': str(latest_file)
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching cached videos: {str(e)}")
        return jsonify({
            'error': f'Failed to fetch cached videos: {str(e)}'
        }), 500

@app.route('/api/trending-videos/refresh', methods=['POST'])
def refresh_trending_videos():
    """Refresh trending videos data"""
    try:
        region_code = request.json.get('region', 'US') if request.json else 'US'
        max_results = request.json.get('max_results', 25) if request.json else 25
        
        logger.info(f"Refreshing trending videos for region: {region_code}")
        
        # This will fetch fresh data
        return get_trending_videos()
        
    except Exception as e:
        logger.error(f"Error refreshing trending videos: {str(e)}")
        return jsonify({
            'error': f'Failed to refresh trending videos: {str(e)}'
        }), 500

@app.route('/api/regions', methods=['GET'])
def get_supported_regions():
    """Get list of supported region codes"""
    from trend_retrieval import VALID_REGION_CODES
    
    regions = [
        {'code': 'US', 'name': 'United States'},
        {'code': 'GB', 'name': 'United Kingdom'},
        {'code': 'CA', 'name': 'Canada'},
        {'code': 'AU', 'name': 'Australia'},
        {'code': 'DE', 'name': 'Germany'},
        {'code': 'FR', 'name': 'France'},
        {'code': 'JP', 'name': 'Japan'},
        {'code': 'IN', 'name': 'India'},
        {'code': 'BR', 'name': 'Brazil'},
        {'code': 'MX', 'name': 'Mexico'},
        {'code': 'KR', 'name': 'South Korea'},
        {'code': 'RU', 'name': 'Russia'},
        {'code': 'IT', 'name': 'Italy'},
        {'code': 'ES', 'name': 'Spain'},
        {'code': 'NL', 'name': 'Netherlands'},
    ]
    
    return jsonify({
        'regions': regions,
        'valid_codes': list(VALID_REGION_CODES)
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Ensure the output directory exists
    formatter.output_dir.mkdir(exist_ok=True)
    
    # Check if API key is available
    if not os.getenv('YOUTUBE_API_KEY'):
        logger.warning("YOUTUBE_API_KEY not found in environment variables")
    
    logger.info("Starting Trend Tide Forge Backend...")
    logger.info(f"Output directory: {formatter.output_dir}")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
