# Cara Menghapus .env dari Git History

## ⚠️ PENTING: Lakukan ini SEBELUM jadikan repo public!

File `.env` mengandung credentials sensitif yang sudah ter-commit. Harus dihapus dari **seluruh history** git.

---

## Method 1: BFG Repo-Cleaner (Recommended, Fastest)

### Step 1: Download BFG

```bash
# Download BFG jar file
# https://rtyley.github.io/bfg-repo-cleaner/
```

Atau pakai chocolatey (Windows):

```bash
choco install bfg-repo-cleaner
```

### Step 2: Backup Repository

```bash
cd d:\git\trakt-telegram-notifier
git clone --mirror . ../trakt-telegram-notifier-backup
```

### Step 3: Hapus .env dari History

```bash
# Hapus file .env dari semua commits
bfg --delete-files .env

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 4: Force Push

```bash
git push origin --force --all
```

---

## Method 2: Git Filter-Branch (Manual, Slower)

```bash
cd d:\git\trakt-telegram-notifier

# Hapus .env dari semua commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

---

## Method 3: Paling Mudah - Reset Repository

Jika repository masih baru dan tidak banyak history:

```bash
# 1. Delete .git folder
rm -rf .git

# 2. Init ulang
git init

# 3. Pastikan .env di .gitignore
echo ".env" >> .gitignore

# 4. Add semua file kecuali .env
git add .
git commit -m "Initial commit - clean"

# 5. Push ke remote baru (force)
git remote add origin YOUR_REPO_URL
git push -u origin main --force
```

---

## ✅ Verification

Setelah cleanup, verify .env sudah hilang:

```bash
# Check tidak ada .env di git
git log --all --full-history -- .env

# Harusnya output kosong (tidak ada hasil)
```

---

## 🔐 Extra Security

Karena credentials sudah pernah ter-commit:

1. **Regenerate semua API keys/tokens**:
   - Trakt: Revoke & create new app
   - TMDB: Regenerate API key
   - Telegram: Revoke bot token (@BotFather `/revoke`)
   - OMDb: Request new key

2. **Update `.env` dengan credentials baru**

3. **Verify `.gitignore`**:
   ```bash
   # Pastikan .env ada di .gitignore
   cat .gitignore | grep .env
   ```

---

## 📝 Checklist

- [ ] Backup repository
- [ ] Hapus .env dari history (pilih method)
- [ ] Verify .env sudah hilang
- [ ] Regenerate semua API keys
- [ ] Update .env dengan keys baru
- [ ] Pastikan .env di .gitignore
- [ ] Test commit baru (pastikan .env tidak ikut)
- [ ] Jadikan repo public

---

**Recommendation**: Pakai **Method 3** (reset repository) karena repo ini masih baru dan simple.
