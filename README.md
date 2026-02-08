# Trakt to Telegram Notifier 🎬→📱

Automatic Telegram notifications when you watch movies/shows on Trakt.tv

## ✨ Features

- **Dual Message Format**: Separate text message + poster image with details
- **Rich Information**: TMDB posters, ratings, genres, runtime, overview
- **Smart Tracking**: JSON file-based tracking prevents duplicate notifications
- **Hybrid Deployment**: Works on both GitHub Actions (free) and VPS
- **Timezone Support**: Auto-converts to WIB (UTC+7)
- **Python**: Simple, reliable, easy to modify

---

## 🚀 Quick Start

### Option 1: GitHub Actions (Free, Recommended)

**Perfect for personal use dengan delay 5-15 menit acceptable**

1. **Fork/Clone repository ini**
2. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):

   ```
   TRAKT_CLIENT_ID=your_client_id
   TRAKT_USERNAME=your_trakt_username
   TMDB_API_KEY=your_tmdb_key
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   TELEGRAM_USERNAME=your_telegram_username
   TELEGRAM_USER_DISPLAY=your_display_name
   ```

3. **Enable GitHub Actions**:
   - Go to Actions tab
   - Enable workflows
   - Manually trigger first run untuk testing

4. **Done!** Script akan jalan otomatis setiap 5 menit.

---

### Option 2: VPS Deployment (Real-time)

**Perfect untuk near real-time notifications (setiap 2 menit)**

#### Setup di VPS:

```bash
# Clone repository
cd /root
git clone https://github.com/YOUR_USERNAME/trakt-telegram-notifier.git
cd trakt-telegram-notifier

# Install dependencies
pip3 install -r requirements.txt

# Create .env file
nano .env
```

**Paste credentials** ke `.env`:

```env
TRAKT_CLIENT_ID=your_client_id
TRAKT_USERNAME=your_trakt_username
TMDB_API_KEY=your_tmdb_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_USERNAME=your_telegram_username
TELEGRAM_USER_DISPLAY=ɑ𝐝𝐢𝐭𝐲𝕏 🜲
```

#### Setup Cron Job:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 2 minutes)
*/2 * * * * cd /root/trakt-telegram-notifier && /usr/bin/python3 trakt_notifier.py >> /var/log/trakt-notifier.log 2>&1
```

**Test manual:**

```bash
python3 trakt_notifier.py
```

---

## 📋 Credentials Setup

### 1. Trakt API

1. Go to https://trakt.tv/oauth/applications
2. Create new application:
   - **Name**: Telegram Notifier
   - **Redirect URI**: `https://zapp.com` (or any URL)
3. Copy **Client ID**
4. Your **Username**: Check your profile URL (`trakt.tv/users/USERNAME`)

### 2. TMDB API

1. Sign up di https://www.themoviedb.org
2. Go to Settings → API
3. Request API key (Developer, free)
4. Copy **API Key (v3 auth)**

### 3. Telegram Bot

1. Chat dengan [@BotFather](https://t.me/BotFather)
2. Send `/newbot` dan ikuti instruksi
3. Copy **Bot Token**
4. Chat dengan [@userinfobot](https://t.me/userinfobot)
5. Copy **Chat ID** (untuk personal chat, atau group ID untuk group)

---

## 🎯 How It Works

1. **Every 5 minutes** (GitHub Actions) or **every 2 minutes** (VPS)
2. Fetch latest 5 watch history items dari Trakt
3. Check `watched.json` untuk prevent duplicates
4. Get movie/show details dari TMDB (poster, rating, genres, etc.)
5. Send dual notification ke Telegram:
   - **Message 1**: User info + title + watch time
   - **Message 2**: Poster image + ratings + overview + genres
6. Update `watched.json` dengan item ID yang sudah dinotifikasi

---

## 📁 Project Structure

```
trakt-telegram-notifier/
├── trakt_notifier.py          # Main Python script
├── requirements.txt           # Python dependencies
├── watched.json              # Tracking file (auto-generated)
├── .env                      # Local credentials (gitignored)
├── .github/
│   └── workflows/
│       └── trakt-notifier.yml # GitHub Actions workflow
└── README.md
```

---

## 🔧 Configuration

### Schedule Interval

**GitHub Actions** (`.github/workflows/trakt-notifier.yml`):

```yaml
schedule:
  - cron: "*/5 * * * *" # Every 5 minutes
```

**VPS crontab**:

```bash
*/2 * * * *  # Every 2 minutes (recommended)
*/5 * * * *  # Every 5 minutes
*/10 * * * * # Every 10 minutes
```

### History Limit

Edit `trakt_notifier.py` line ~240:

```python
history = get_trakt_history(client_id, username, limit=5)  # Change 5 to your preference
```

---

## 🐛 Troubleshooting

### No notifications received

1. **Check credentials**: Ensure all environment variables set correctly
2. **Check Trakt username**: Must be your public username, not "me"
3. **Test manually**: Run `python3 trakt_notifier.py` locally
4. **Check logs**:
   - GitHub Actions: Actions tab → workflow runs
   - VPS: `tail -f /var/log/trakt-notifier.log`

### "Trakt API error: 401"

- Wrong Client ID or username private. Make sure your Trakt profile is public.

### "Telegram error"

- Wrong Bot Token or Chat ID. Test dengan send manual message:
  ```bash
  curl -X POST "https://api.telegram.org/botYOUR_TOKEN/sendMessage" \
    -d "chat_id=YOUR_CHAT_ID&text=Test"
  ```

---

## 📝 Notes

- **GitHub Actions delay**: GitHub cron schedules dapat delay 5-15 menit (gratis, acceptable)
- **VPS advantage**: Near real-time (2 min interval), lebih reliable
- **Hybrid mode**: Bisa run di both! VPS untuk real-time, GitHub sebagai backup
- **Free tier**: Semua services (Trakt, TMDB, Telegram, GitHub Actions) gratis

---

## 🎨 Customization

Edit message format di `trakt_notifier.py`:

- `format_first_message()` - Text message format
- `format_second_caption()` - Photo caption format

---

## 📜 License

MIT

---

## 🙏 Credits

- [Trakt.tv](https://trakt.tv) - Watch tracking
- [TMDB](https://www.themoviedb.org) - Movie database
- [Telegram](https://telegram.org) - Notifications

---

**Enjoy your automated Trakt notifications! 🎉**
