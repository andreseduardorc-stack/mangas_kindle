import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

# Fetch https://olympusxyz.com/series/comic-el-hijo20-225-de-la-espada13424
url = 'https://olympusxyz.com/series/comic-el-hijo20-225-de-la-espada13424'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# find all _nuxt js files
scripts = re.findall(r'/_nuxt/([a-zA-Z0-9_\-\.]+)\.js', html)
print("Scripts on series page:", scripts)

for s in set(scripts):
    js_url = f"https://olympusxyz.com/_nuxt/{s}.js"
    try:
        r = urllib.request.Request(js_url, headers=headers)
        with urllib.request.urlopen(r, timeout=5) as js_resp:
            content = js_resp.read().decode('utf-8', errors='ignore')
            # Look for chapters, /api/, fetch, etc.
            matches = re.findall(r'["\']([^"\']*(?:chapter|capitulo|api|series|swordflake)[^"\']*)["\']', content, re.IGNORECASE)
            endpoints = [m for m in matches if '/' in m and len(m) < 100]
            if endpoints:
                print(f"\nEndpoints in {s}.js:")
                for e in set(endpoints)[:15]:
                    print("  ", e)
    except Exception as err:
        pass

