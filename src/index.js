/**
 * Cloudflare Worker - Trakt to Telegram Notifier
 * Main entry point dan cron handler
 */

import { getTraktRating, getTmdbId, getImdbId } from './trakt.js';
import { getMovieDetails, getTvShowDetails, getPosterUrl } from './tmdb.js';
import { sendDualNotification } from './telegram.js';
import { isAlreadyNotified, markAsNotified, setLastCheckTime, log } from './utils.js';

/**
 * Get user history dari Trakt (alternative endpoint)
 */
async function getUserHistory(username, clientId, limit = 10) {
  const url = `https://api.trakt.tv/users/${username}/history?limit=${limit}`;
  
  log('Fetching from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
    },
  });
  
  log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Trakt API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Main handler untuk cron trigger
 */
async function handleCron(env) {
  log('Starting Trakt check...');
  
  // Debug: Check if env variables are loaded
  log('Env check:', {
    hasClientId: !!env.TRAKT_CLIENT_ID,
    hasUsername: !!env.TRAKT_USERNAME,
    clientIdLength: env.TRAKT_CLIENT_ID?.length || 0,
  });
  
  try {
    // Get watch history dari Trakt menggunakan username
    const username = env.TRAKT_USERNAME || 'me'; // 'me' untuk authenticated user
    const history = await getUserHistory(
      username,
      env.TRAKT_CLIENT_ID,
      5 // Check 5 items terakhir
    );
    
    log(`Found ${history.length} recent items`);
    
    // Process setiap item
    for (const item of history) {
      const itemId = item.id.toString();
      
      // Skip jika sudah pernah dinotifikasi
      if (await isAlreadyNotified(env.WATCHED_TRACKER, itemId)) {
        log(`Item ${itemId} already notified, skipping`);
        continue;
      }
      
      log(`Processing new item: ${itemId}`);
      
      // Hanya process movies dan shows, skip episodes untuk saat ini
      if (!item.movie && !item.show) {
        log('Skipping episode or unknown type');
        continue;
      }
      
      // Get TMDB data
      const tmdbId = getTmdbId(item);
      const imdbId = getImdbId(item);
      
      let tmdbData = null;
      let posterUrl = null;
      
      if (tmdbId) {
        if (item.movie) {
          tmdbData = await getMovieDetails(tmdbId, env.TMDB_API_KEY);
        } else if (item.show) {
          tmdbData = await getTvShowDetails(tmdbId, env.TMDB_API_KEY);
        }
        
        if (tmdbData && tmdbData.poster_path) {
          posterUrl = getPosterUrl(tmdbData.poster_path);
        }
      }
      
      // Get ratings
      const traktRating = getTraktRating(item);
      const imdbRating = null; // Bisa enhance dengan fetch dari OMDb API
      
      // Send dual notification ke Telegram
      await sendDualNotification(
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_CHAT_ID,
        item,
        env.TELEGRAM_USER_DISPLAY || 'ɑ𝐝𝐢𝐭𝐲𝕏 🜲',
        env.TELEGRAM_USERNAME || 'ZYGYU',
        traktRating,
        tmdbData,
        posterUrl,
        imdbRating
      );
      
      log(`Notification sent for item: ${itemId}`);
      
      // Mark sebagai sudah dinotifikasi
      await markAsNotified(env.WATCHED_TRACKER, itemId, item.watched_at);
    }
    
    // Update last check time
    await setLastCheckTime(env.WATCHED_TRACKER, new Date().toISOString());
    
    log('Trakt check completed');
    
  } catch (error) {
    console.error('Error in handleCron:', error);
    throw error;
  }
}

/**
 * Cloudflare Worker fetch handler
 */
export default {
  /**
   * Scheduled trigger (cron)
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(env));
  },
  
  /**
   * HTTP request handler (untuk manual testing)
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Manual trigger endpoint
    if (url.pathname === '/check') {
      try {
        await handleCron(env);
        return new Response('Check completed successfully', { status: 200 });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }
    
    // Debug endpoint - show history
    if (url.pathname === '/history') {
      try {
        const username = env.TRAKT_USERNAME || 'me';
        const history = await getUserHistory(username, env.TRAKT_CLIENT_ID, 5);
        return new Response(JSON.stringify(history, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    
    return new Response('Trakt to Telegram Notifier is running\n\nEndpoints:\n  /check - Manual trigger\n  /history - View raw history\n  /health - Health check', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
