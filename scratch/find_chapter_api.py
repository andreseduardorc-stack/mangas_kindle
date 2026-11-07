import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

# In nuxt_series.json, let's search all scripts mentioned in HTML
url = 'https://olympusxyz.com/series/comic-el-hijo20-225-de-la-espada13424'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

scripts = re.findall(r'/_nuxt/([a-zA-Z0-9_\-\.]+)\.js', html)

for s in scripts:
    js_url = f"https://olympusxyz.com/_nuxt/{s}.js"
    try:
        r = urllib.request.Request(js_url, headers=headers)
        with urllib.request.urlopen(r, timeout=5) as js_resp:
            code = js_resp.read().decode('utf-8', errors='ignore')
            if 'capitulo' in code.lower() or 'chapter' in code.lower() or 'chapters' in code.lower():
                print(f"Found match in {s}.js!")
                # Look for API calls / strings
                apis = re.findall(r'["\'](/api/[^"\']+)["\']', code)
                if apis:
                    print("  APIs:", apis)
                # Look for template strings with series
                series_calls = re.findall(r'[`"\']([^`"\']*(?:series|capitulo|chapters)[^`"\']*)[`"\']', code)
                calls = [c for c in series_calls if len(c) < 80 and ('/' in c or '$' in c)]
                if calls:
                    print("  Calls:", calls[:10])
    except:
        pass

