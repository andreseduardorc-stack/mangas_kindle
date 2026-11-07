import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

url = 'https://olympusxyz.com/series/comic-el-hijo20-225-de-la-espada13424'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Search for hrefs
hrefs = re.findall(r'href="([^"]+)"', html)
print("Hrefs found on series page:")
for h in set(hrefs):
    if not h.endswith('.css') and not h.endswith('.js'):
        print(" ", h)

