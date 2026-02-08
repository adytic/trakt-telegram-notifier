# Cara Mendapatkan OMDb API Key

## OMDb API (Free)

OMDb API memberikan akses ke IMDb ratings dan Rotten Tomatoes Tomatometer **GRATIS**.

### Steps:

1. **Buka** http://www.omdbapi.com/apikey.aspx

2. **Pilih FREE tier**:
   - 1,000 daily requests
   - Cukup untuk personal use

3. **Isi form**:
   - Email address
   - First name
   - Account type: **FREE! (1,000 daily limit)**

4. **Submit** dan check email Anda

5. **Activate** API key dari link di email

6. **Copy** API key yang diberikan

7. **Paste** ke `.env`:
   ```env
   OMDB_API_KEY=your_actual_api_key_here
   ```

### Test OMDb API

Setelah dapat API key, test dengan:

```bash
curl "http://www.omdbapi.com/?i=tt0111161&apikey=YOUR_KEY"
```

Response akan include:

- `imdbRating`: e.g., "9.3"
- `Ratings`: Array dengan Rotten Tomatoes percentage

---

**FREE tier = 1,000 requests/day = Lebih dari cukup!**

Dengan schedule 5 menit (288 runs/day), bahkan kalau tiap run ada 3 movies = 864 requests/day ✅
