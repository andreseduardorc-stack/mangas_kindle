import urllib.request
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://olympusxyz.com/'
}

def test_api(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read().decode('utf-8')
            print(f"SUCCESS {url}: len={len(data)}, type={resp.headers.get('Content-Type')}")
            try:
                j = json.loads(data)
                if isinstance(j, dict):
                    print("  Keys:", list(j.keys()))
                    if 'data' in j:
                        print("  Data count:", len(j['data']) if isinstance(j['data'], list) else type(j['data']))
                        if isinstance(j['data'], list) and len(j['data']) > 0:
                            print("  Sample item keys:", list(j['data'][0].keys()))
            except:
                pass
    except Exception as e:
        print(f"FAILED {url}: {e}")

test_api('https://olympusxyz.com/api/series')
test_api('https://olympusxyz.com/api/series?page=1')
test_api('https://olympusxyz.com/api/series?page=2')
test_api('https://olympusxyz.com/api/series?name=espada')
test_api('https://olympusxyz.com/api/series?tipo=comic')
test_api('https://olympusxyz.com/api/search?name=espada')
test_api('https://olympusxyz.com/api/search?q=espada')

