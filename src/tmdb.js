/**
 * TMDB API Integration
 */

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Get movie details dari TMDB
 * @param {number} tmdbId - TMDB movie ID
 * @param {string} apiKey - TMDB API key
 * @returns {Promise<Object>} Movie details
 */
export async function getMovieDetails(tmdbId, apiKey) {
  if (!tmdbId) return null;
  
  const url = `${TMDB_API_BASE}/movie/${tmdbId}?api_key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status}`);
    return null;
  }
  
  return await response.json();
}

/**
 * Get TV show details dari TMDB
 * @param {number} tmdbId - TMDB show ID
 * @param {string} apiKey - TMDB API key
 * @returns {Promise<Object>} Show details
 */
export async function getTvShowDetails(tmdbId, apiKey) {
  if (!tmdbId) return null;
  
  const url = `${TMDB_API_BASE}/tv/${tmdbId}?api_key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status}`);
    return null;
  }
  
  return await response.json();
}

/**
 * Generate poster URL dari poster path
 * @param {string} posterPath - TMDB poster path
 * @param {string} size - Image size (default: w500)
 * @returns {string|null}
 */
export function getPosterUrl(posterPath, size = 'w500') {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

/**
 * Get genres string dari array genres
 * @param {Array} genres - Array of genre objects
 * @returns {string}
 */
export function formatGenres(genres) {
  if (!genres || genres.length === 0) return 'N/A';
  return genres.map(g => g.name).join(', ');
}
