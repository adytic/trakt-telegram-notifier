import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File-based storage untuk tracking (menggantikan KV)
 */
const WATCHED_FILE = path.join(__dirname, 'watched.json');

/**
 * Load watched data dari file
 */
async function loadWatched() {
  try {
    const data = await fs.readFile(WATCHED_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { items: {}, lastCheck: null };
  }
}

/**
 * Save watched data ke file
 */
async function saveWatched(data) {
  await fs.writeFile(WATCHED_FILE, JSON.stringify(data, null, 2));
}

/**
 * Check apakah item sudah pernah dinotifikasi
 */
export async function isAlreadyNotified(itemId) {
  const data = await loadWatched();
  return !!data.items[itemId];
}

/**
 * Mark item sebagai sudah dinotifikasi
 */
export async function markAsNotified(itemId, timestamp) {
  const data = await loadWatched();
  data.items[itemId] = timestamp;
  await saveWatched(data);
}

/**
 * Get timestamp terakhir check
 */
export async function getLastCheckTime() {
  const data = await loadWatched();
  return data.lastCheck;
}

/**
 * Update timestamp terakhir check
 */
export async function setLastCheckTime(timestamp) {
  const data = await loadWatched();
  data.lastCheck = timestamp;
  await saveWatched(data);
}

/**
 * Convert UTC date ke WIB timezone
 */
export function convertToWIB(utcDate) {
  const date = new Date(utcDate);
  
  // WIB is UTC+7
  const wibOffset = 7 * 60; // minutes
  const wibDate = new Date(date.getTime() + wibOffset * 60 * 1000);
  
  const day = String(wibDate.getUTCDate()).padStart(2, '0');
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const year = wibDate.getUTCFullYear();
  const hours = String(wibDate.getUTCHours()).padStart(2, '0');
  const minutes = String(wibDate.getUTCMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes} WIB`;
}

/**
 * Format runtime dari menit ke "Xh Ym"
 */
export function formatRuntime(minutes) {
  if (!minutes) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Log with timestamp
 */
export function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}
