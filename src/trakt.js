/**
 * Trakt API Integration
 */

const TRAKT_API_BASE = 'https://api.trakt.tv';

/**
 * Get recent watch history dari Trakt
 * @param {string} accessToken - Trakt access token
 * @param {string} clientId - Trakt client ID
 * @param {number} limit - Number of items to fetch (default: 10)
 * @returns {Promise<Array>} Array of history items
 */
export async function getWatchHistory(accessToken, clientId, limit = 10) {
  const url = `${TRAKT_API_BASE}/sync/history?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Refresh access token menggunakan refresh token
 * @param {string} refreshToken - Trakt refresh token
 * @param {string} clientId - Trakt client ID
 * @param {string} clientSecret - Trakt client secret
 * @returns {Promise<Object>} New tokens
 */
export async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const url = `${TRAKT_API_BASE}/oauth/token`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Trakt token refresh error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Extract rating dari Trakt item
 * @param {Object} item - Trakt history item
 * @returns {string} Rating atau 'N/A'
 */
export function getTraktRating(item) {
  // Trakt tidak return rating di history endpoint
  // Harus fetch dari /movies/{id}/ratings atau /shows/{id}/ratings
  // Untuk simplicity, kita return N/A dulu atau bisa enhance nanti
  return 'N/A';
}

/**
 * Get TMDB ID dari Trakt item
 * @param {Object} item - Trakt history item
 * @returns {number|null}
 */
export function getTmdbId(item) {
  const ids = item.movie?.ids || item.show?.ids || item.episode?.ids;
  return ids?.tmdb || null;
}

/**
 * Get IMDb ID dari Trakt item
 * @param {Object} item - Trakt history item
 * @returns {string|null}
 */
export function getImdbId(item) {
  const ids = item.movie?.ids || item.show?.ids || item.episode?.ids;
  return ids?.imdb || null;
}
