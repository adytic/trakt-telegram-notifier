import os
import requests
import json

# Konfigurasi Nama App untuk User-Agent & Query Params
APP_NAME = "TraktToSimklSync"
APP_VERSION = "1.0"

TRAKT_API_URL = "https://trakt-api.proxl.workers.dev/"

# Mengambil variabel rahasia dari GitLab/GitHub
SIMKL_ACCESS_TOKEN = os.environ.get("SIMKL_ACCESS_TOKEN")
SIMKL_CLIENT_ID = os.environ.get("SIMKL_CLIENT_ID")

# Endpoint SIMKL yang sudah dilengkapi Required Query Parameters
SIMKL_API_URL = f"https://api.simkl.com/sync/history?client_id={SIMKL_CLIENT_ID}&app-name={APP_NAME}&app-version={APP_VERSION}"

def sync_to_simkl():
    print("Mengecek data terbaru dari Trakt API...")
    response = requests.get(TRAKT_API_URL)
    
    if response.status_code != 200:
        print(f"Gagal mengambil data dari Trakt: {response.status_code}")
        return
        
    trakt_data = response.json()
    
    if not trakt_data.get("success") or not trakt_data.get("data"):
        print("Tidak ada data history untuk disinkronisasi.")
        return

    simkl_payload = {"movies": [], "shows": []}
    shows_grouped = {}

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
            
            if tmdb_id not in shows_grouped:
                shows_grouped[tmdb_id] = {
                    "title": item["title"],
                    "year": item["year"],
                    "ids": {
                        "tmdb": tmdb_id,
                        "imdb": item["ids"].get("imdb")
                    },
                    "episodes": []
                }
            
            shows_grouped[tmdb_id]["episodes"].append({
                "season": item["episode_info"]["season"],
                "number": item["episode_info"]["number"],
                "watched_at": item["watched_at"]
            })

    simkl_payload["shows"] = list(shows_grouped.values())

    # Required HTTP Headers (Menambahkan User-Agent)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SIMKL_ACCESS_TOKEN}",
        "simkl-api-key": SIMKL_CLIENT_ID,
        "User-Agent": f"{APP_NAME}/{APP_VERSION}"
    }

   # Mengirim (POST) ke SIMKL
    simkl_response = requests.post(SIMKL_API_URL, headers=headers, json=simkl_payload)
    
    if simkl_response.status_code in [200, 201]:
        print("\n✅ Berhasil sinkronisasi ke SIMKL!")
        print("Response SIMKL:", simkl_response.json())
    else:
        print(f"\n❌ Gagal sinkronisasi. Status: {simkl_response.status_code}")
        print("Error Details:", simkl_response.text)

if __name__ == "__main__":
    if not SIMKL_ACCESS_TOKEN or not SIMKL_CLIENT_ID:
        print("Error: SIMKL_ACCESS_TOKEN atau SIMKL_CLIENT_ID belum di-set di Variables!")
    else:
        sync_to_simkl()
