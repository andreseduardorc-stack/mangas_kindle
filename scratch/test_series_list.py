import urllib.request
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

url = 'https://olympusxyz.com/api/series/list'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Data type:", type(data))
        if isinstance(data, dict):
            print("Keys:", list(data.keys()))
            if 'data' in data:
                print("Data length:", len(data['data']))
                print("Sample 0:", data['data'][0])
        elif isinstance(data, list):
            print("Length:", len(data))
            print("Sample 0:", data[0])
except Exception as e:
    print("Error:", e)

