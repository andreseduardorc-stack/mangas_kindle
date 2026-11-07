import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept': '*/*',
    'Referer': 'https://olympusxyz.com/'
}

# Fetch series page HTML
url = 'https://olympusxyz.com/series'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

scripts = re.findall(r'/_nuxt/([a-zA-Z0-9_\-\.]+)\.js', html)

for s in set(scripts):
    js_url = f"https://olympusxyz.com/_nuxt/{s}.js"
    try:
        r = urllib.request.Request(js_url, headers=headers)
        with urllib.request.urlopen(r, timeout=4) as js_resp:
            code = js_resp.read().decode('utf-8', errors='ignore')
            if '/api/series' in code or 'api/series' in code or 'buscar' in code:
                # Find queries or params
                matches = re.findall(r'/api/series[^\s"\'`)]*', code)
                if matches:
                    print(f"Found in {s}.js:")
                    for m in set(matches):
                        print("  ", m)
    except:
        pass

