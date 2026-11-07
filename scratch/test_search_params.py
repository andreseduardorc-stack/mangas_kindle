import urllib.request
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

params_to_test = [
    'name=villano',
    'search=villano',
    'q=villano',
    'title=villano',
    'filter=villano',
    'query=villano',
    'keyword=villano'
]

for p in params_to_test:
    url = f"https://olympusxyz.com/api/series?{p}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            total = data.get('data', {}).get('series', {}).get('total')
            names = [s['name'] for s in data.get('data', {}).get('series', {}).get('data', [])[:3]]
            print(f"Param '{p}' -> Total: {total}, Names: {names}")
    except Exception as e:
        print(f"Param '{p}' -> Error: {e}")

