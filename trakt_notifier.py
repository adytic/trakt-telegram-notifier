#!/usr/bin/env python3
"""
Trakt to Telegram Notifier
Hybrid version untuk VPS & GitHub Actions
"""

import os
import json
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Configuration
TRACKED_FILE = Path(__file__).parent / "watched.json"

def load_tracked() -> Dict:
    """Load tracked items dari file"""
    if TRACKED_FILE.exists():
        with open(TRACKED_FILE, 'r') as f:
            return json.load(f)
    return {"items": {}, "lastCheck": None}

def save_tracked(data: Dict):
    """Save tracked items ke file"""
    with open(TRACKED_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def is_already_notified(item_id: str) -> bool:
    """Check apakah item sudah dinotifikasi"""
    data = load_tracked()
    return str(item_id) in data["items"]

def mark_as_notified(item_id: str, timestamp: str):
    """Mark item sebagai sudah dinotifikasi"""
    data = load_tracked()
    data["items"][str(item_id)] = timestamp
    data["lastCheck"] = datetime.now(timezone.utc).isoformat()
    save_tracked(data)

def convert_to_wib(utc_date: str) -> str:
    """Convert UTC date ke WIB timezone"""
    dt = datetime.fromisoformat(utc_date.replace('Z', '+00:00'))
    wib = dt + timedelta(hours=7)
    return wib.strftime("%d-%m-%Y %H:%M WIB")

def format_runtime(minutes: Optional[int]) -> str:
    """Format runtime dari menit ke 'Xh Ym'"""
    if not minutes:
        return "N/A"
    hours = minutes // 60
    mins = minutes % 60
    if hours == 0:
        return f"{mins}m"
    if mins == 0:
        return f"{hours}h"
    return f"{hours}h {mins}m"

def get_trakt_history(client_id: str, username: str = "me", limit: int = 5) -> list:
    """Fetch watch history dari Trakt"""
    url = f"https://api.trakt.tv/users/{username}/history"
    headers = {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": client_id,
    }
    params = {"limit": limit}
    
    print(f"[INFO] Fetching from: {url}")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        raise Exception(f"Trakt API error: {response.status_code} {response.text}")
    
    return response.json()

def get_tmdb_movie_details(tmdb_id: int, api_key: str) -> Optional[Dict]:
    """Fetch movie details dari TMDB"""
    if not tmdb_id:
        return None
    
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"api_key": api_key}
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"[WARN] TMDB API error: {response.status_code}")
        return None
    
    return response.json()

def get_tmdb_tv_details(tmdb_id: int, api_key: str) -> Optional[Dict]:
    """Fetch TV show details dari TMDB"""
    if not tmdb_id:
        return None
    
    url = f"https://api.themoviedb.org/3/tv/{tmdb_id}"
    params = {"api_key": api_key}
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"[WARN] TMDB API error: {response.status_code}")
        return None
    
    return response.json()

def get_omdb_ratings(imdb_id: str, api_key: str) -> tuple[Optional[str], Optional[str]]:
    """Fetch IMDb rating and Rotten Tomatoes dari OMDb API
    Returns: (imdb_rating, tomato_meter)
    """
    if not imdb_id or not api_key:
        return None, None
    
    url = "http://www.omdbapi.com/"
    params = {
        "i": imdb_id,
        "apikey": api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code != 200:
            print(f"[WARN] OMDb API error: {response.status_code}")
            return None, None
        
        data = response.json()
        if data.get('Response') != 'True':
            return None, None
        
        # Get IMDb rating
        imdb_rating = data.get('imdbRating')
        if imdb_rating == 'N/A':
            imdb_rating = None
        
        # Get Rotten Tomatoes Tomatometer
        tomato_meter = None
        ratings = data.get('Ratings', [])
        for rating in ratings:
            if rating.get('Source') == 'Rotten Tomatoes':
                tomato_meter = rating.get('Value')  # e.g., "85%"
                break
        
        return imdb_rating, tomato_meter
    except Exception as e:
        print(f"[WARN] OMDb API exception: {e}")
        return None, None

def get_poster_url(poster_path: Optional[str], size: str = "w500") -> Optional[str]:
    """Generate poster URL dari TMDB"""
    if not poster_path:
        return None
    return f"https://image.tmdb.org/t/p/{size}{poster_path}"

def send_telegram_message(bot_token: str, chat_id: str, text: str):
    """Send text message ke Telegram"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    
    response = requests.post(url, json=data)
    if response.status_code != 200:
        raise Exception(f"Telegram sendMessage error: {response.status_code} {response.text}")
    
    return response.json()

def send_telegram_photo(bot_token: str, chat_id: str, photo_url: str, caption: str):
    """Send photo dengan caption ke Telegram"""
    url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
    data = {
        "chat_id": chat_id,
        "photo": photo_url,
        "caption": caption,
        "parse_mode": "HTML",
    }
    
    response = requests.post(url, json=data)
    if response.status_code != 200:
        raise Exception(f"Telegram sendPhoto error: {response.status_code} {response.text}")
    
    return response.json()

def format_first_message(item: Dict, user_display: str, username: str) -> str:
    """Format message pertama (text only) - with link and bold"""
    title = item.get('movie', {}).get('title') or item.get('show', {}).get('title', 'Unknown')
    year = item.get('movie', {}).get('year') or item.get('show', {}).get('year', '')
    watched_at = convert_to_wib(item['watched_at'])
    telegram_link = f"https://t.me/{username}"
    
    return f"""👤 <a href="{telegram_link}">{user_display}</a> Just Watched <b>{title}</b>
<b>Released:</b> {year or 'N/A'}
<b>Watched:</b> {watched_at}"""

def format_poster_caption(item: Dict, tmdb_data: Optional[Dict], imdb_rating: Optional[str] = None, tomato_rating: Optional[str] = None) -> str:
    """Format caption untuk poster (with bold runtime and ratings)"""
    # Get data
    title = item.get('movie', {}).get('title') or item.get('show', {}).get('title', 'Unknown')
    year = item.get('movie', {}).get('year') or item.get('show', {}).get('year', '')
    
    tmdb_rating = tmdb_data.get('vote_average', 0) if tmdb_data else 0
    vote_count = tmdb_data.get('vote_count', 0) if tmdb_data else 0
    runtime = format_runtime(tmdb_data.get('runtime') if tmdb_data else None)
    overview = tmdb_data.get('overview', 'No overview available.') if tmdb_data else 'No overview available.'
    
    genres = 'N/A'
    if tmdb_data and tmdb_data.get('genres'):
        genres = ', '.join(g['name'] for g in tmdb_data['genres'])
    
    # Format ratings
    tomato_display = f"<b>{tomato_rating}</b>" if tomato_rating else "N/A"
    imdb_display = f"<b>{imdb_rating}</b>/10" if imdb_rating else "N/A/10"
    
    # Format caption with bold runtime and ratings
    caption = f"""<b>{title}</b> ({year})

⭐ <b>{tmdb_rating:.1f}/10</b> ({vote_count} votes)
🕐 <b>{runtime}</b>

<blockquote>{overview}</blockquote>

<b>Genres</b> {genres}

<b>Ratings</b>
▪️<b>Tomatometer</b>  {tomato_display}
▪️ <b>TMDB</b>   <b>{tmdb_rating:.1f}/10</b>
▪️ <b>IMDb</b>   {imdb_display}"""
    
    return caption

def send_notification(bot_token: str, chat_id: str, item: Dict, user_display: str,
                     username: str, tmdb_data: Optional[Dict], poster_url: Optional[str],
                     imdb_rating: Optional[str] = None, tomato_rating: Optional[str] = None):
    """Send notification (dual message style)"""
    # Message 1: Text info
    first_msg = format_first_message(item, user_display, username)
    send_telegram_message(bot_token, chat_id, first_msg)
    
    # Small delay
    import time
    time.sleep(0.5)
    
    # Message 2: Poster with caption
    caption = format_poster_caption(item, tmdb_data, imdb_rating, tomato_rating)
    if poster_url:
        send_telegram_photo(bot_token, chat_id, poster_url, caption)
    else:
        send_telegram_message(bot_token, chat_id, caption)

def main():
    """Main function"""
    print("=" * 60)
    print("Trakt to Telegram Notifier - Python Edition")
    print("=" * 60)
    
    # Load environment variables
    client_id = os.getenv('TRAKT_CLIENT_ID')
    username = os.getenv('TRAKT_USERNAME', 'me')
    tmdb_api_key = os.getenv('TMDB_API_KEY')
    omdb_api_key = os.getenv('OMDB_API_KEY')  # Optional for IMDb + Rotten Tomatoes
    telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    telegram_chat_id = os.getenv('TELEGRAM_CHAT_ID')
    telegram_username = os.getenv('TELEGRAM_USERNAME', 'ZYGYU')
    telegram_user_display = os.getenv('TELEGRAM_USER_DISPLAY', 'ɑ𝐝𝐢𝐭𝐲𝕏 🜲')
    telegram_channel_name = os.getenv('TELEGRAM_CHANNEL_NAME', 'MOVIES history 🎬')
    
    # Validate
    if not all([client_id, tmdb_api_key, telegram_bot_token, telegram_chat_id]):
        raise Exception("Missing required environment variables")
    
    print(f"[INFO] Environment variables loaded")
    print(f"[INFO] Using Trakt username: {username}")
    
    try:
        # Get watch history
        history = get_trakt_history(client_id, username, limit=5)
        print(f"[INFO] Found {len(history)} recent items")
        
        notified_count = 0
        
        for item in history:
            item_id = str(item['id'])
            
            # Skip if already notified
            if is_already_notified(item_id):
                print(f"[INFO] Item {item_id} already notified, skipping")
                continue
            
            # Skip episodes
            if not item.get('movie') and not item.get('show'):
                print(f"[INFO] Skipping episode or unknown type")
                continue
            
            title = item.get('movie', {}).get('title') or item.get('show', {}).get('title', 'Unknown')
            print(f"[INFO] Processing: {title}")
            
            # Get TMDB data
            tmdb_id = None
            tmdb_data = None
            poster_url = None
            
            if item.get('movie'):
                tmdb_id = item['movie'].get('ids', {}).get('tmdb')
                if tmdb_id:
                    tmdb_data = get_tmdb_movie_details(tmdb_id, tmdb_api_key)
            elif item.get('show'):
                tmdb_id = item['show'].get('ids', {}).get('tmdb')
                if tmdb_id:
                    tmdb_data = get_tmdb_tv_details(tmdb_id, tmdb_api_key)
            
            if tmdb_data and tmdb_data.get('poster_path'):
                poster_url = get_poster_url(tmdb_data['poster_path'])
            
            # Get IMDb ID and fetch ratings from OMDb
            imdb_id = None
            imdb_rating = None
            tomato_rating = None
            
            if item.get('movie'):
                imdb_id = item['movie'].get('ids', {}).get('imdb')
            elif item.get('show'):
                imdb_id = item['show'].get('ids', {}).get('imdb')
            
            if imdb_id and omdb_api_key:
                imdb_rating, tomato_rating = get_omdb_ratings(imdb_id, omdb_api_key)
            
            # Send notification
            send_notification(
                telegram_bot_token,
                telegram_chat_id,
                item,
                telegram_user_display,
                telegram_username,
                tmdb_data,
                poster_url,
                imdb_rating,
                tomato_rating
            )
            
            print(f"[SUCCESS] ✅ Notification sent for: {title}")
            
            # Mark as notified
            mark_as_notified(item_id, item['watched_at'])
            notified_count += 1
        
        print("=" * 60)
        print(f"✅ Check completed! Sent {notified_count} notification(s)")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()
