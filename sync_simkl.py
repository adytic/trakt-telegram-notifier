import os
import requests
import json

# Konfigurasi URL
TRAKT_API_URL = "https://trakt-api.proxl.workers.dev/"
SIMKL_API_URL = "https://api.simkl.com/sync/history"

# Mengambil variabel rahasia dari GitHub Secrets
SIMKL_ACCESS_TOKEN = os.environ.get("SIMKL_ACCESS_TOKEN")
SIMKL_CLIENT_ID = os.environ.get("SIMKL_CLIENT_ID")

def sync_to_simkl():
    print("Mengecek data terbaru dari Trakt API...")
    response = requests.get(TRAKT_API_URL)
    
    if response.status_code != 200:
        print(f"Gagal mengambil data dari API kamu: {response.status_code}")
        return
        
    trakt_data = response.json()
    
    if not trakt_data.get("success") or not trakt_data.get("data"):
        print("Tidak ada data history untuk disinkronisasi.")
        return

    simkl_payload = {"movies": [], "shows": []}
    shows_grouped = {}

    # Konversi format data
    for item in trakt_data["data"]:
        if item["type"] == "movie":
            simkl_payload["movies"].append({
                "title": item["title"],
                "year": item["year"],
                "ids": {
                    "tmdb": item["ids"].get("tmdb"),
                    "imdb": item["ids"].get("imdb")
                },
                "watched_at": item["watched_at"]
            })
        elif item["type"] == "episode":
            tmdb_id = item["ids"].get("tmdb")
            
            # Jika serial belum ada di dictionary, buat format dasarnya
            if tmdb_id not in shows_grouped:
                shows_grouped[tmdb_id] = {
                    "title": item["title"], # Judul Series
                    "year": item["year"],
                    "ids": {
                        "tmdb": tmdb_id,
                        "imdb": item["ids"].get("imdb")
                    },
                    "episodes": []
                }
            
            # Masukkan detail episode ke dalam serial tersebut
            shows_grouped[tmdb_id]["episodes"].append({
                "season": item["episode_info"]["season"],
                "number": item["episode_info"]["number"],
                "watched_at": item["watched_at"]
            })

    # Pindahkan serial yang sudah di-group ke dalam payload utama
    simkl_payload["shows"] = list(shows_grouped.values())

    print(f"Payload untuk SIMKL:\n{json.dumps(simkl_payload, indent=2)}")

    # Header Otorisasi SIMKL
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SIMKL_ACCESS_TOKEN}",
        "simkl-api-key": SIMKL_CLIENT_ID
    }

    # Kirim ke SIMKL
    simkl_response = requests.post(SIMKL_API_URL, headers=headers, json=simkl_payload)
    
    if simkl_response.status_code == 200:
        print("\n✅ Berhasil sinkronisasi ke SIMKL!")
        print("Response SIMKL:", simkl_response.json())
    else:
        print(f"\n❌ Gagal sinkronisasi. Status: {simkl_response.status_code}")
        print("Error Details:", simkl_response.text)

if __name__ == "__main__":
    if not SIMKL_ACCESS_TOKEN or not SIMKL_CLIENT_ID:
        print("Error: SIMKL_ACCESS_TOKEN atau SIMKL_CLIENT_ID belum disetting!")
    else:
        sync_to_simkl()
