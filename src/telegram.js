/**
 * Telegram Bot API Integration
 */

import { convertToWIB, formatRuntime } from './utils.js';
import { formatGenres } from './tmdb.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Send text message ke Telegram
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 * @param {string} text - Message text
 * @returns {Promise<Object>}
 */
export async function sendTextMessage(botToken, chatId, text) {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram sendMessage error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

/**
 * Send photo dengan caption ke Telegram
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 * @param {string} photoUrl - Photo URL
 * @param {string} caption - Photo caption
 * @returns {Promise<Object>}
 */
export async function sendPhotoMessage(botToken, chatId, photoUrl, caption) {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendPhoto`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram sendPhoto error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

/**
 * Format message pertama (text only)
 * @param {Object} item - Trakt history item
 * @param {string} userDisplay - Display name dengan unicode
 * @param {string} username - Telegram username
 * @returns {string}
 */
export function formatFirstMessage(item, userDisplay, username) {
  const title = item.movie?.title || item.show?.title || 'Unknown';
  const year = item.movie?.year || item.show?.year || '';
  const releaseDate = year ? `${year}` : 'N/A';
  const watchedAt = convertToWIB(item.watched_at);
  
  const telegramLink = `https://t.me/${username}`;
  
  return `👤 ${userDisplay} (<a href="${telegramLink}">${telegramLink}</a>) Just Watched ${title}
Released: ${releaseDate}
Watched: ${watchedAt}`;
}

/**
 * Format caption untuk message kedua (photo caption)
 * @param {Object} item - Trakt history item
 * @param {string} traktRating - Trakt rating
 * @param {Object} tmdbData - TMDB details
 * @param {string|null} imdbRating - IMDb rating (optional)
 * @returns {string}
 */
export function formatSecondCaption(item, traktRating, tmdbData, imdbRating = null) {
  const tmdbRatingValue = tmdbData?.vote_average?.toFixed(1) || 'N/A';
  const voteCount = tmdbData?.vote_count || 0;
  const runtime = formatRuntime(tmdbData?.runtime);
  const overview = tmdbData?.overview || 'No overview available.';
  const genres = formatGenres(tmdbData?.genres);
  const imdbValue = imdbRating || 'N/A';
  
  return `⭐ ${tmdbRatingValue}/10 (${voteCount} votes)
🕕 ${runtime}

${overview}

Genres ${genres}

Ratings
▫️ Trakt  ${traktRating}/10
▫️ TMDB   ${tmdbRatingValue}/10
▫️ IMDb   ${imdbValue}/10`;
}

/**
 * Send dual notification ke Telegram
 * @param {string} botToken
 * @param {string} chatId
 * @param {Object} item - Trakt history item
 * @param {string} userDisplay
 * @param {string} username
 * @param {string} traktRating
 * @param {Object} tmdbData
 * @param {string} posterUrl
 * @param {string|null} imdbRating
 */
export async function sendDualNotification(
  botToken,
  chatId,
  item,
  userDisplay,
  username,
  traktRating,
  tmdbData,
  posterUrl,
  imdbRating = null
) {
  // Send message pertama
  const firstMessage = formatFirstMessage(item, userDisplay, username);
  await sendTextMessage(botToken, chatId, firstMessage);
  
  // Delay sedikit antara 2 messages
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Send message kedua dengan poster
  const caption = formatSecondCaption(item, traktRating, tmdbData, imdbRating);
  
  if (posterUrl) {
    await sendPhotoMessage(botToken, chatId, posterUrl, caption);
  } else {
    // Fallback jika tidak ada poster
    await sendTextMessage(botToken, chatId, caption);
  }
}
