import urllib.request
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

url = 'https://olympusxyz.com/api/series/bj-arc10-05-2025himago5324'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Keys:", list(data.keys()))
        if 'data' in data:
            print("Data sample:", {k: v for k, v in data['data'].items() if k not in ['chapters']})
except Exception as e:
    print("Error:", e)

