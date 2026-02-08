#!/usr/bin/env node

/**
 * Trakt to Telegram Notifier - GitHub Actions Version
 * Main entry point
 */

import dotenv from 'dotenv';
import { getTraktRating, getTmdbId, getImdbId } from './src/trakt.js';
import { getMovieDetails, getTvShowDetails, getPosterUrl } from './src/tmdb.js';
import { sendDualNotification } from './src/telegram.js';
import { isAlreadyNotified, markAsNotified, setLastCheckTime, log } from './src/utils.js';

// Load .env untuk local testing
dotenv.config();

/**
 * Get user history dari Trakt
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
    throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Main handler
 */
async function main() {
  log('========================================');
  log('Starting Trakt to Telegram Notifier');
  log('========================================');
  
  try {
    // Get environment variables
    const clientId = process.env.TRAKT_CLIENT_ID;
    const username = process.env.TRAKT_USERNAME || 'me';
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const telegramUsername = process.env.TELEGRAM_USERNAME || 'ZYGYU';
    const telegramUserDisplay = process.env.TELEGRAM_USER_DISPLAY || 'ɑ𝐝𝐢𝐭𝐲𝕏 🜲';
    
    // Validate required env vars
    if (!clientId || !tmdbApiKey || !telegramBotToken || !telegramChatId) {
      throw new Error('Missing required environment variables');
    }
    
    log('Environment variables loaded successfully');
    
    // Get watch history dari Trakt
    const history = await getUserHistory(username, clientId, 5);
    
    log(`Found ${history.length} recent items`);
    
    let notifiedCount = 0;
    
    // Process setiap item
    for (const item of history) {
      const itemId = item.id.toString();
      
      // Skip jika sudah pernah dinotifikasi
      if (await isAlreadyNotified(itemId)) {
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
      
      let tmdbData = null;
      let posterUrl = null;
      
      if (tmdbId) {
        if (item.movie) {
          tmdbData = await getMovieDetails(tmdbId, tmdbApiKey);
        } else if (item.show) {
          tmdbData = await getTvShowDetails(tmdbId, tmdbApiKey);
        }
        
        if (tmdbData && tmdbData.poster_path) {
          posterUrl = getPosterUrl(tmdbData.poster_path);
        }
      }
      
      // Get ratings
      const traktRating = getTraktRating(item);
      const imdbRating = null;
      
      // Send dual notification ke Telegram
      await sendDualNotification(
        telegramBotToken,
        telegramChatId,
        item,
        telegramUserDisplay,
        telegramUsername,
        traktRating,
        tmdbData,
        posterUrl,
        imdbRating
      );
      
      log(`✅ Notification sent for: ${item.movie?.title || item.show?.title}`);
      
      // Mark sebagai sudah dinotifikasi
      await markAsNotified(itemId, item.watched_at);
      notifiedCount++;
    }
    
    // Update last check time
    await setLastCheckTime(new Date().toISOString());
    
    log('========================================');
    log(`✅ Check completed! Sent ${notifiedCount} notification(s)`);
    log('========================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run main
main();
