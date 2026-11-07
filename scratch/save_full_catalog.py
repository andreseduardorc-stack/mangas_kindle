import urllib.request
import json
import os

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

url = 'https://olympusxyz.com/api/series/list'
print("Fetching full catalog of 897+ series from Olympus...")

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))

raw_series = data.get('data', [])
print(f"Downloaded {len(raw_series)} series from Olympus!")

os.makedirs('src/data', exist_ok=True)
with open('src/data/olympusAllSeries.json', 'w', encoding='utf-8') as f:
    json.dump(raw_series, f, indent=2, ensure_ascii=False)

print("Saved to src/data/olympusAllSeries.json successfully!")

