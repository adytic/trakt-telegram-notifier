# Trakt to Telegram Notifier

Cloudflare Worker yang mengirim notifikasi ke Telegram secara otomatis saat Anda selesai menonton film/show di Trakt.

## ✨ Features

- ✅ **Auto-notification** setiap 2 menit via cron trigger
- ✅ **Dual message format** - text message + poster dengan detail lengkap
- ✅ **Multiple ratings** - Trakt, TMDB, dan IMDb
- ✅ **Timezone WIB** - konversi otomatis dari UTC
- ✅ **No duplicates** - tracking via Cloudflare KV
- ✅ **Serverless** - gratis di Cloudflare Workers free tier

## 📋 Prerequisites

Sebelum setup, Anda perlu:

1. **Akun Cloudflare** (gratis) - [signup di sini](https://dash.cloudflare.com/sign-up)
2. **Node.js & npm** - [download di sini](https://nodejs.org/)
3. **Trakt API credentials**
4. **TMDB API key**
5. **Telegram bot**

## 🔑 Setup Credentials

### 1. Trakt API

1. Login ke [trakt.tv](https://trakt.tv)
2. Buka https://trakt.tv/oauth/applications/new
3. Isi form:
   - **Name**: Trakt Telegram Notifier
   - **Redirect URI**: `urn:ietf:wg:oauth:2.0:oob`
4. Simpan **Client ID** dan **Client Secret**

**Get Access Token:**

```bash
# Buka URL ini di browser (ganti YOUR_CLIENT_ID):
https://trakt.tv/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob

# Copy authorization code yang muncul
# Lalu run curl ini (ganti CLIENT_ID, CLIENT_SECRET, dan CODE):
curl -X POST https://api.trakt.tv/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_CODE",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
    "grant_type": "authorization_code"
  }'

# Response akan berisi access_token dan refresh_token - simpan keduanya!
```

### 2. TMDB API

1. Buat akun di [themoviedb.org](https://www.themoviedb.org/signup)
2. Login, lalu ke https://www.themoviedb.org/settings/api
3. Request API key (pilih "Developer")
4. Isi form sederhana
5. Copy **API Key (v3 auth)**

### 3. Telegram Bot

1. Buka Telegram, search **@BotFather**
2. Send command: `/newbot`
3. Ikuti instruksi, beri nama bot Anda
4. Copy **Bot Token** yang diberikan

**Get Chat ID:**

1. Search **@userinfobot** di Telegram
2. Click Start
3. Copy **ID** Anda (angka panjang)

## 📦 Installation

```bash
# Clone atau download proyek ini
cd d:\git\trakt-telegram-notifier

# Install dependencies
npm install
```

## ⚙️ Configuration

### 1. Setup KV Namespace

```bash
# Login ke Cloudflare
npx wrangler login

# Buat KV namespace
npx wrangler kv:namespace create WATCHED_TRACKER

# Copy KV ID yang muncul, lalu edit wrangler.toml:
# Ganti YOUR_KV_NAMESPACE_ID dengan ID yang baru dibuat
```

### 2. Setup Secrets

```bash
# Set secrets via Wrangler CLI:
npx wrangler secret put TRAKT_CLIENT_ID
# Paste value, tekan Enter

npx wrangler secret put TRAKT_CLIENT_SECRET
npx wrangler secret put TRAKT_ACCESS_TOKEN
npx wrangler secret put TRAKT_REFRESH_TOKEN
npx wrangler secret put TMDB_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

**Atau set via Cloudflare Dashboard:**

1. Buka https://dash.cloudflare.com
2. Pilih Workers & Pages → Your Worker → Settings → Variables
3. Add environment variables:
   - `TRAKT_CLIENT_ID`
   - `TRAKT_CLIENT_SECRET`
   - `TRAKT_ACCESS_TOKEN`
   - `TRAKT_REFRESH_TOKEN`
   - `TMDB_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### 3. Customize User Display (Optional)

Edit `wrangler.toml`:

```toml
[vars]
TELEGRAM_USERNAME = "username_anda"
TELEGRAM_USER_DISPLAY = "Nama Display Anda"
```

## 🚀 Deployment

### Deploy ke Cloudflare

```bash
# Deploy ke production
npx wrangler deploy
```

Worker akan otomatis berjalan setiap 2 menit!

### Test Manual

```bash
# Test di local
npx wrangler dev

# Di terminal lain, trigger manual:
curl http://localhost:8787/check
```

Atau setelah deploy, trigger via URL:

```bash
curl https://trakt-telegram-notifier.YOUR_SUBDOMAIN.workers.dev/check
```

## 🎨 Caption Format

**Message 1:**

```
👤 ɑ𝐝𝐢𝐭𝐲𝕏 🜲 (https://t.me/ZYGYU) Just Watched Altered
Released: 2025
Watched: 26-11-2025 10:35 WIB
```

**Message 2 (dengan poster):**

```
⭐ 6.9/10 (27 votes)
🕕 1h 25m

In an alternate present, genetically enhanced humans dominate society...

Genres Science Fiction, Action

Ratings
▫️ Trakt  5.2/10
▫️ TMDB   6.9/10
▫️ IMDb   N/A/10
```

## 🔧 Customization

### Ubah Interval Cron

Edit `wrangler.toml`:

```toml
[triggers]
crons = ["*/1 * * * *"]  # Setiap 1 menit
# atau
crons = ["*/5 * * * *"]  # Setiap 5 menit
```

**Note:** Cloudflare free tier support cron minimum 1 menit.

### Add IMDb Ratings

Untuk mendapatkan IMDb ratings, Anda bisa integrate dengan [OMDb API](http://www.omdbapi.com/) (gratis 1000 requests/hari):

1. Get API key dari OMDb
2. Edit `src/index.js`, tambahkan fetch ke OMDb API
3. Pass `imdbRating` ke `sendDualNotification()`

## 📊 Monitoring

### View Logs

```bash
# Stream logs real-time
npx wrangler tail
```

### Check KV Storage

```bash
# List semua keys
npx wrangler kv:key list --binding=WATCHED_TRACKER

# Get specific key value
npx wrangler kv:key get "notified:12345" --binding=WATCHED_TRACKER
```

## 🐛 Troubleshooting

### Notifikasi tidak masuk

1. **Check cron trigger di Cloudflare Dashboard:**
   - Workers & Pages → Your Worker → Triggers → Cron Triggers
   - Pastikan cron sudah terdaftar

2. **Check logs:**

   ```bash
   npx wrangler tail
   ```

3. **Test manual:**
   ```bash
   curl https://your-worker.workers.dev/check
   ```

### Poster tidak muncul

- TMDB API key invalid atau quota habis
- Poster path kosong (film lama mungkin tidak punya poster)
- Check logs untuk error dari TMDB

### Duplicate notifications

- KV namespace ID salah di `wrangler.toml`
- KV binding name tidak match (harus `WATCHED_TRACKER`)

## 📝 Notes

- **Free tier limits:**
  - Cloudflare Workers: 100,000 requests/hari
  - TMDB API: Tidak ada hard limit, tapi jangan abuse
  - Telegram Bot: 30 messages/detik
- **Cron reliability:**
  - Cloudflare cron sangat reliable (±1 detik)
  - Tidak seperti GitHub Actions yang sering delay

- **Privacy:**
  - Semua credentials disimpan sebagai secrets di Cloudflare
  - Tidak ada data yang tersimpan selain di KV (item IDs yang sudah dinotifikasi)

## 🤝 Contributing

Feel free to fork dan customize sesuai kebutuhan!

## 📄 License

MIT
