import urllib.request
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

req = urllib.request.Request('https://olympusxyz.com/api/series?page=1', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

print("Data keys:", data['data'].keys() if isinstance(data['data'], dict) else type(data['data']))
if 'series' in data['data']:
    print("Series keys:", data['data']['series'].keys())
    series_list = data['data']['series']['data']
    print(f"Total series on page 1: {len(series_list)}")
    print("Pagination info:", {k: v for k, v in data['data']['series'].items() if k != 'data'})
    print("Sample series 0:", series_list[0])

