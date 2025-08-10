from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

# Import functions from trend_retrieval
from trend_retrieval import (
    fetch_youtube_trending_videos,
    fetch_youtube_trending_topics,
    fetch_youtube_trending_music,
    get_tiktok_trending,
    list_youtube_video_categories,
    fetch_popular_videos_by_category,
    VALID_REGION_CODES
)


class TrendResultFormatter:
    """Formats and saves trend retrieval results in JSON format."""
    
    def __init__(self, output_dir: str = "trend_results"):
        """Initialize the formatter with output directory.
        
        Args:
            output_dir: Directory to save formatted results
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def format_youtube_videos(self, videos: List[Dict[str, Any]], 
                             region_code: str = "US",
                             include_metadata: bool = True) -> Dict[str, Any]:
        """Format YouTube trending videos results.
        
        Args:
            videos: List of video data from fetch_youtube_trending_videos
            region_code: Region code used for the search
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_videos = []
        
        for video in videos:
            formatted_video = {
                "video_id": video.get("id"),
                "title": video.get("title"),
                "channel": video.get("channelTitle"),
                "published_date": video.get("publishedAt"),
                "statistics": {
                    "views": int(video.get("viewCount", 0)) if video.get("viewCount") else 0,
                    "likes": int(video.get("likeCount", 0)) if video.get("likeCount") else 0,
                    "comments": int(video.get("commentCount", 0)) if video.get("commentCount") else 0
                },
                "category_id": video.get("categoryId"),
                "tags": video.get("tags", []),
                "description": video.get("description", "")[:2000] + "..." if video.get("description") and len(video.get("description", "")) > 2000 else video.get("description", "")
            }
            
            # Add captions if available
            if "captions" in video and video["captions"]:
                captions = video["captions"]
                formatted_video["captions"] = {
                    "available": True,
                    "language": captions.get("language"),
                    "is_auto_generated": captions.get("is_auto", False),
                    "format": captions.get("format"),
                    "method": captions.get("method"),
                    "content_length": len(captions.get("content", ""))
                }
            else:
                formatted_video["captions"] = {"available": False}
            
            formatted_videos.append(formatted_video)
        
        result = {
            "videos": formatted_videos,
            "total_count": len(formatted_videos)
        }
        
        if include_metadata:
            result["metadata"] = {
                "source": "YouTube Trending API",
                "region_code": region_code,
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "trending_videos"
            }
        
        return result
    
    def format_youtube_topics(self, topics: List[str], 
                             region_code: str = "US",
                             include_metadata: bool = True) -> Dict[str, Any]:
        """Format YouTube trending topics results.
        
        Args:
            topics: List of topic titles from fetch_youtube_trending_topics
            region_code: Region code used for the search
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_topics = []
        
        for i, topic in enumerate(topics, 1):
            formatted_topics.append({
                "rank": i,
                "title": topic,
                "word_count": len(topic.split())
            })
        
        result = {
            "topics": formatted_topics,
            "total_count": len(formatted_topics)
        }
        
        if include_metadata:
            result["metadata"] = {
                "source": "YouTube Trending API",
                "region_code": region_code,
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "trending_topics"
            }
        
        return result
    
    def format_youtube_music(self, music_videos: List[Dict[str, Any]], 
                            region_code: str = "US",
                            include_metadata: bool = True) -> Dict[str, Any]:
        """Format YouTube trending music results.
        
        Args:
            music_videos: List of music video data from fetch_youtube_trending_music
            region_code: Region code used for the search
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_music = []
        
        for video in music_videos:
            formatted_video = {
                "video_id": video.get("id"),
                "title": video.get("title"),
                "channel": video.get("channelTitle"),
                "published_date": video.get("publishedAt"),
                "statistics": {
                    "views": int(video.get("viewCount", 0)) if video.get("viewCount") else 0,
                    "likes": int(video.get("likeCount", 0)) if video.get("likeCount") else 0,
                    "comments": int(video.get("commentCount", 0)) if video.get("commentCount") else 0
                },
                "tags": video.get("tags", []),
                "description": video.get("description", "")[:2000] + "..." if video.get("description") and len(video.get("description", "")) > 2000 else video.get("description", "")
            }
            
            # Add captions if available
            if "captions" in video and video["captions"]:
                captions = video["captions"]
                formatted_video["captions"] = {
                    "available": True,
                    "language": captions.get("language"),
                    "is_auto_generated": captions.get("is_auto", False),
                    "format": captions.get("format"),
                    "method": captions.get("method"),
                    "content_length": len(captions.get("content", ""))
                }
            else:
                formatted_video["captions"] = {"available": False}
            
            formatted_music.append(formatted_video)
        
        result = {
            "music_videos": formatted_music,
            "total_count": len(formatted_music)
        }
        
        if include_metadata:
            result["metadata"] = {
                "source": "YouTube Trending API",
                "region_code": region_code,
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "trending_music",
                "category": "Music (ID: 10)"
            }
        
        return result
    
    def format_tiktok_trends(self, tiktok_data: Dict[str, List[Dict[str, Any]]], 
                             include_metadata: bool = True) -> Dict[str, Any]:
        """Format TikTok trending data results.
        
        Args:
            tiktok_data: Dictionary with hashtags and sounds from get_tiktok_trending
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_hashtags = []
        for i, hashtag in enumerate(tiktok_data.get("hashtags", []), 1):
            formatted_hashtags.append({
                "rank": i,
                "hashtag": hashtag.get("hashtag", ""),
                "play_count": hashtag.get("count", 0),
                "formatted_count": self._format_large_number(hashtag.get("count", 0))
            })
        
        formatted_sounds = []
        for i, sound in enumerate(tiktok_data.get("sounds", []), 1):
            formatted_sounds.append({
                "rank": i,
                "sound_name": sound.get("sound_name", ""),
                "play_count": sound.get("play_count", 0),
                "formatted_count": self._format_large_number(sound.get("play_count", 0))
            })
        
        result = {
            "hashtags": {
                "trending": formatted_hashtags,
                "total_count": len(formatted_hashtags)
            },
            "sounds": {
                "trending": formatted_sounds,
                "total_count": len(formatted_sounds)
            }
        }
        
        if include_metadata:
            result["metadata"] = {
                "source": "TikTok Trending API (Apify)",
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "trending_hashtags_and_sounds"
            }
        
        return result
    
    def format_youtube_video_categories(self, categories: List[Dict[str, Any]], 
                                       region_code: Optional[str] = None,
                                       video_ids: Optional[List[str]] = None,
                                       include_metadata: bool = True) -> Dict[str, Any]:
        """Format YouTube video categories results.
        
        Args:
            categories: List of category data from list_youtube_video_categories
            region_code: Region code used for the search (optional)
            video_ids: Video IDs used for the search (optional)
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_categories = []
        
        for category in categories:
            formatted_category = {
                "id": category.get("id"),
                "title": category.get("title"),
                "channel_id": category.get("channel_id"),
                "assignable": category.get("assignable", True)
            }
            formatted_categories.append(formatted_category)
        
        result = {
            "video_categories": formatted_categories,
            "total_count": len(formatted_categories)
        }
        
        if include_metadata:
            metadata = {
                "source": "YouTube Video Categories API",
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "video_categories"
            }
            
            if region_code:
                metadata["region_code"] = region_code
                metadata["search_type"] = "by_region"
            elif video_ids:
                metadata["video_ids"] = video_ids
                metadata["search_type"] = "by_video_ids"
                metadata["video_count"] = len(video_ids)
            
            result["metadata"] = metadata
        
        return result
    
    def format_popular_videos_by_category(self, videos: List[Dict[str, Any]], 
                                         category_id: str,
                                         region_code: str = "US",
                                         include_metadata: bool = True) -> Dict[str, Any]:
        """Format popular videos by category results.
        
        Args:
            videos: List of video data from fetch_popular_videos_by_category
            category_id: YouTube category ID used for the search
            region_code: Region code used for the search
            include_metadata: Whether to include metadata about the search
            
        Returns:
            Formatted dictionary ready for JSON serialization
        """
        formatted_videos = []
        
        for video in videos:
            formatted_video = {
                "video_id": video.get("id"),
                "title": video.get("title"),
                "channel_title": video.get("channel_title"),
                "channel_id": video.get("channel_id"),
                "published_at": video.get("published_at"),
                "category_id": video.get("category_id"),
                "duration": video.get("duration"),
                "statistics": {
                    "views": video.get("view_count", 0),
                    "likes": video.get("like_count", 0),
                    "comments": video.get("comment_count", 0),
                    "formatted_views": self._format_large_number(video.get("view_count", 0)),
                    "formatted_likes": self._format_large_number(video.get("like_count", 0)),
                    "formatted_comments": self._format_large_number(video.get("comment_count", 0))
                },
                "thumbnail_url": video.get("thumbnail_url"),
                "tags": video.get("tags", []),
                "description": video.get("description", "")[:500] + "..." if video.get("description") and len(video.get("description", "")) > 500 else video.get("description", "")
            }
            formatted_videos.append(formatted_video)
        
        result = {
            "popular_videos": formatted_videos,
            "total_count": len(formatted_videos)
        }
        
        if include_metadata:
            result["metadata"] = {
                "source": "YouTube Popular Videos API",
                "category_id": category_id,
                "region_code": region_code,
                "retrieved_at": datetime.now().isoformat(),
                "data_type": "popular_videos_by_category"
            }
        
        return result
    
    def _format_large_number(self, num: int) -> str:
        """Format large numbers with K, M, B suffixes."""
        if num >= 1_000_000_000:
            return f"{num / 1_000_000_000:.1f}B"
        elif num >= 1_000_000:
            return f"{num / 1_000_000:.1f}M"
        elif num >= 1_000:
            return f"{num / 1_000:.1f}K"
        else:
            return str(num)
    
    def save_to_json(self, data: Dict[str, Any], filename: str, 
                     pretty_print: bool = True) -> str:
        """Save formatted data to a JSON file.
        
        Args:
            data: Formatted data dictionary
            filename: Name of the file (without extension)
            pretty_print: Whether to format JSON with indentation
            
        Returns:
            Path to the saved file
        """
        # Ensure filename has .json extension
        if not filename.endswith('.json'):
            filename += '.json'
        
        filepath = self.output_dir / filename
        
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(exist_ok=True)
        
        # Save to JSON file
        with open(filepath, 'w', encoding='utf-8') as f:
            if pretty_print:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            else:
                json.dump(data, f, ensure_ascii=False, default=str)
        
        return str(filepath)
    
    def format_and_save_youtube_videos(self, region_code: str = "US", 
                                      max_results: int = 25,
                                      include_captions: bool = False,
                                      caption_language: str = 'en',
                                      filename: Optional[str] = None,
                                      api_key: Optional[str] = None) -> str:
        """Fetch, format, and save YouTube trending videos.
        
        Args:
            region_code: Country code for trending videos
            max_results: Maximum number of videos to fetch
            include_captions: Whether to fetch captions
            caption_language: Language for captions
            filename: Custom filename (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Path to the saved file
        """
        videos = fetch_youtube_trending_videos(
            region_code=region_code,
            max_results=max_results,
            include_captions=include_captions,
            caption_language=caption_language,
            api_key=api_key
        )
        
        formatted_data = self.format_youtube_videos(videos, region_code)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"youtube_trending_videos_{region_code}_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def format_and_save_youtube_topics(self, region_code: str = "US",
                                      max_results: int = 25,
                                      filename: Optional[str] = None,
                                      api_key: Optional[str] = None) -> str:
        """Fetch, format, and save YouTube trending topics.
        
        Args:
            region_code: Country code for trending topics
            max_results: Maximum number of topics to fetch
            filename: Custom filename (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Path to the saved file
        """
        topics = fetch_youtube_trending_topics(
            region_code=region_code,
            max_results=max_results,
            api_key=api_key
        )
        
        formatted_data = self.format_youtube_topics(topics, region_code)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"youtube_trending_topics_{region_code}_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def format_and_save_youtube_music(self, region_code: str = "US",
                                     max_results: int = 25,
                                     filename: Optional[str] = None,
                                     api_key: Optional[str] = None) -> str:
        """Fetch, format, and save YouTube trending music.
        
        Args:
            region_code: Country code for trending music
            max_results: Maximum number of music videos to fetch
            filename: Custom filename (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Path to the saved file
        """
        music_videos = fetch_youtube_trending_music(
            region_code=region_code,
            max_results=max_results,
            api_key=api_key
        )
        
        formatted_data = self.format_youtube_music(music_videos, region_code)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"youtube_trending_music_{region_code}_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def format_and_save_tiktok_trends(self, filename: Optional[str] = None,
                                     api_key: Optional[str] = None) -> str:
        """Fetch, format, and save TikTok trending data.
        
        Args:
            filename: Custom filename (optional)
            api_key: Apify API token (optional)
            
        Returns:
            Path to the saved file
        """
        tiktok_data = get_tiktok_trending(api_key=api_key)
        
        formatted_data = self.format_tiktok_trends(tiktok_data)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tiktok_trending_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def format_and_save_video_categories_for_region(self, region_code: str,
                                                   filename: Optional[str] = None,
                                                   api_key: Optional[str] = None) -> str:
        """Fetch, format, and save YouTube video categories for a specific region.
        
        Args:
            region_code: Country code for video categories
            filename: Custom filename (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Path to the saved file
        """
        categories = list_youtube_video_categories(
            region_code=region_code,
            api_key=api_key
        )
        
        formatted_data = self.format_youtube_video_categories(
            categories, region_code=region_code
        )
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"youtube_video_categories_{region_code}_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def format_and_save_popular_videos_by_category(self, category_id: str,
                                                  n: int = 10,
                                                  region_code: str = "US",
                                                  filename: Optional[str] = None,
                                                  api_key: Optional[str] = None) -> str:
        """Fetch, format, and save popular videos for a specific category.
        
        Args:
            category_id: YouTube video category ID
            n: Number of popular videos to fetch
            region_code: Country code for regional popularity
            filename: Custom filename (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Path to the saved file
        """
        videos = fetch_popular_videos_by_category(
            category_id=category_id,
            n=n,
            region_code=region_code,
            api_key=api_key
        )
        
        formatted_data = self.format_popular_videos_by_category(
            videos, category_id=category_id, region_code=region_code
        )
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"youtube_popular_videos_category_{category_id}_{region_code}_{timestamp}.json"
        
        return self.save_to_json(formatted_data, filename)
    
    def collect_all_categories_and_popular_videos(self, 
                                                 max_videos_per_category: int = 10,
                                                 output_dir: Optional[str] = None,
                                                 api_key: Optional[str] = None) -> Dict[str, List[str]]:
        """Collect video categories and popular videos for all available regions.
        
        This method will:
        1. Get all video categories for each region
        2. For each category in each region, get the top N popular videos
        3. Save all data to separate JSON files
        
        Args:
            max_videos_per_category: Maximum videos to fetch per category
            output_dir: Custom output directory (optional)
            api_key: YouTube API key (optional)
            
        Returns:
            Dictionary with lists of saved file paths for categories and videos
        """
        if output_dir:
            original_dir = self.output_dir
            self.output_dir = Path(output_dir)
            self.output_dir.mkdir(exist_ok=True)
        
        try:
            saved_files = {
                "category_files": [],
                "popular_video_files": [],
                "errors": []
            }
            
            print(f"Starting comprehensive collection for {len(VALID_REGION_CODES)} regions...")
            
            for i, region_code in enumerate(sorted(VALID_REGION_CODES), 1):
                print(f"Processing region {i}/{len(VALID_REGION_CODES)}: {region_code}")
                
                try:
                    # Step 1: Get and save categories for this region
                    print(f"  Fetching categories for {region_code}...")
                    categories_file = self.format_and_save_video_categories_for_region(
                        region_code=region_code,
                        api_key=api_key
                    )
                    saved_files["category_files"].append(categories_file)
                    print(f"  Saved categories: {categories_file}")
                    
                    # Step 2: Get categories data to know which categories exist in this region
                    categories = list_youtube_video_categories(
                        region_code=region_code,
                        api_key=api_key
                    )
                    
                    print(f"  Found {len(categories)} categories in {region_code}")
                    
                    # Step 3: For each category, get popular videos
                    for j, category in enumerate(categories, 1):
                        category_id = category.get("id")
                        category_title = category.get("title", "Unknown")
                        
                        if not category_id:
                            continue
                            
                        try:
                            print(f"    Category {j}/{len(categories)}: {category_title} (ID: {category_id})")
                            
                            videos_file = self.format_and_save_popular_videos_by_category(
                                category_id=category_id,
                                n=max_videos_per_category,
                                region_code=region_code,
                                api_key=api_key
                            )
                            saved_files["popular_video_files"].append(videos_file)
                            print(f"    Saved popular videos: {videos_file}")
                            
                        except Exception as e:
                            error_msg = f"Error processing category {category_id} in {region_code}: {e}"
                            print(f"    ERROR: {error_msg}")
                            saved_files["errors"].append(error_msg)
                            continue
                    
                except Exception as e:
                    error_msg = f"Error processing region {region_code}: {e}"
                    print(f"  ERROR: {error_msg}")
                    saved_files["errors"].append(error_msg)
                    continue
                
                print(f"  Completed region {region_code}")
                print()  # Empty line for readability
            
            # Save summary
            summary_data = {
                "collection_summary": {
                    "total_regions_processed": len(VALID_REGION_CODES),
                    "total_category_files": len(saved_files["category_files"]),
                    "total_popular_video_files": len(saved_files["popular_video_files"]),
                    "total_errors": len(saved_files["errors"]),
                    "max_videos_per_category": max_videos_per_category,
                    "collection_completed_at": datetime.now().isoformat(),
                    "regions_processed": sorted(list(VALID_REGION_CODES))
                },
                "saved_files": saved_files
            }
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            summary_file = self.save_to_json(
                summary_data, 
                f"youtube_complete_collection_summary_{timestamp}.json"
            )
            
            print(f"Collection complete! Summary saved to: {summary_file}")
            print(f"Total files created: {len(saved_files['category_files']) + len(saved_files['popular_video_files']) + 1}")
            if saved_files["errors"]:
                print(f"Errors encountered: {len(saved_files['errors'])}")
            
            return saved_files
            
        finally:
            # Restore original output directory if it was changed
            if output_dir:
                self.output_dir = original_dir


# Convenience functions for quick usage
def save_youtube_trending_videos(region_code: str = "US", 
                                max_results: int = 25,
                                include_captions: bool = False,
                                output_dir: str = "trend_results",
                                filename: Optional[str] = None,
                                api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save YouTube trending videos."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_youtube_videos(
        region_code=region_code,
        max_results=max_results,
        include_captions=include_captions,
        filename=filename,
        api_key=api_key
    )


def save_youtube_trending_topics(region_code: str = "US",
                                max_results: int = 25,
                                output_dir: str = "trend_results",
                                filename: Optional[str] = None,
                                api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save YouTube trending topics."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_youtube_topics(
        region_code=region_code,
        max_results=max_results,
        filename=filename,
        api_key=api_key
    )


def save_youtube_trending_music(region_code: str = "US",
                               max_results: int = 25,
                               output_dir: str = "trend_results",
                               filename: Optional[str] = None,
                               api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save YouTube trending music."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_youtube_music(
        region_code=region_code,
        max_results=max_results,
        filename=filename,
        api_key=api_key
    )


def save_tiktok_trending(output_dir: str = "trend_results",
                         filename: Optional[str] = None,
                         api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save TikTok trending data."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_tiktok_trends(
        filename=filename,
        api_key=api_key
    )


def save_all_youtube_categories_and_popular_videos(max_videos_per_category: int = 10,
                                                  output_dir: str = "trend_results",
                                                  api_key: Optional[str] = None) -> Dict[str, List[str]]:
    """Quick function to collect all YouTube categories and popular videos for all regions.
    
    This function will:
    1. Get video categories for all available regions
    2. For each category in each region, get top N popular videos
    3. Save everything to separate JSON files with a comprehensive summary
    
    Args:
        max_videos_per_category: Maximum videos to fetch per category (default: 10)
        output_dir: Directory to save all files (default: "trend_results")
        api_key: YouTube API key (optional, uses environment variable if not provided)
        
    Returns:
        Dictionary containing lists of saved file paths and any errors
    """
    formatter = TrendResultFormatter(output_dir)
    return formatter.collect_all_categories_and_popular_videos(
        max_videos_per_category=max_videos_per_category,
        api_key=api_key
    )


def save_youtube_categories_for_region(region_code: str = "US",
                                     output_dir: str = "trend_results",
                                     filename: Optional[str] = None,
                                     api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save YouTube video categories for a specific region."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_video_categories_for_region(
        region_code=region_code,
        filename=filename,
        api_key=api_key
    )


def save_popular_videos_by_category(category_id: str,
                                  n: int = 10,
                                  region_code: str = "US",
                                  output_dir: str = "trend_results",
                                  filename: Optional[str] = None,
                                  api_key: Optional[str] = None) -> str:
    """Quick function to fetch and save popular videos for a specific category."""
    formatter = TrendResultFormatter(output_dir)
    return formatter.format_and_save_popular_videos_by_category(
        category_id=category_id,
        n=n,
        region_code=region_code,
        filename=filename,
        api_key=api_key
    )


if __name__ == "__main__":
    # Example usage
    print("Trend Result Formatter - Example Usage")
    print("=" * 50)
    
    # Create formatter instance
    formatter = TrendResultFormatter()
    
    try:
        # Example: Save YouTube trending videos (US region, top 10)
        print("Fetching and saving YouTube trending videos...")
        video_file = formatter.format_and_save_youtube_videos(
            region_code="US", 
            max_results=10,
            include_captions=False
        )
        print(f"Saved to: {video_file}")
        
        # Example: Save YouTube trending topics
        print("\nFetching and saving YouTube trending topics...")
        topics_file = formatter.format_and_save_youtube_topics(
            region_code="US", 
            max_results=15
        )
        print(f"Saved to: {topics_file}")
        
        # Example: Save YouTube video categories for US
        print("\nFetching and saving YouTube video categories for US...")
        categories_file = formatter.format_and_save_video_categories_for_region(
            region_code="US"
        )
        print(f"Saved to: {categories_file}")
        
        # Example: Save popular videos for Gaming category (ID: 20)
        print("\nFetching and saving popular gaming videos...")
        gaming_file = formatter.format_and_save_popular_videos_by_category(
            category_id="20",  # Gaming category
            n=15,
            region_code="US"
        )
        print(f"Saved to: {gaming_file}")
        
        # Example: Save TikTok trending data
        print("\nFetching and saving TikTok trending data...")
        tiktok_file = formatter.format_and_save_tiktok_trends()
        print(f"Saved to: {tiktok_file}")
        
        print("\nAll example data has been formatted and saved successfully!")
        
        # Comprehensive collection example (commented out due to large scope)
        print("\n" + "=" * 50)
        print("COMPREHENSIVE COLLECTION EXAMPLE:")
        print("To collect ALL categories and popular videos for ALL regions, run:")
        print("save_all_youtube_categories_and_popular_videos(max_videos_per_category=5)")
        print("WARNING: This will make hundreds of API calls and may take a long time!")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error during example execution: {e}")
        print("Make sure you have the required API keys set in your environment.")