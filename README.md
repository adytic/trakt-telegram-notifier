# Trakt to Telegram Notifier

Automatic Telegram notifications when you watch movies/shows on Trakt.tv

## Features

- 🎬 Dual message format (text + poster)
- ⭐ TMDB ratings, posters, genres, runtime
- 🍅 Rotten Tomatoes Tomatometer (via OMDb)
- 📊 IMDb ratings (via OMDb)
- ⏰ Timezone support (WIB/UTC+7)
- 🔄 Smart tracking prevents duplicates

## Quick Setup

### 1. Get API Credentials

- **Trakt**: https://trakt.tv/oauth/applications
- **TMDB**: https://www.themoviedb.org/settings/api
- **OMDb**: http://www.omdbapi.com/apikey.aspx (FREE)
- **Telegram**: @BotFather + @userinfobot

### 2. Configure GitHub Secrets

Add these in Settings → Secrets and variables → Actions:

```
TRAKT_CLIENT_ID
TRAKT_USERNAME
TMDB_API_KEY
OMDB_API_KEY (optional)
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_USERNAME
TELEGRAM_USER_DISPLAY
```

### 3. Enable GitHub Actions

Go to Actions tab → Enable workflows

Done! Runs every 5 minutes automatically.

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run
python trakt_notifier.py
```

## VPS Deployment (Optional)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/trakt-telegram-notifier.git
cd trakt-telegram-notifier

# Install
pip3 install -r requirements.txt

# Setup .env
nano .env  # paste credentials

# Add cron job (every 5 minutes)
crontab -e
# Add: */5 * * * * cd /path/to/repo && python3 trakt_notifier.py
```

## License

MIT
