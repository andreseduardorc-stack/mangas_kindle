import urllib.request
import json

urls = [
    'https://corsproxy.io/?url=https://olympusxyz.com/api/series/list',
    'https://api.allorigins.win/raw?url=https://olympusxyz.com/api/series/list'
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Proxy SUCCESS {u}: count={len(data.get('data', []))}")
    except Exception as e:
        print(f"Proxy FAILED {u}: {e}")

