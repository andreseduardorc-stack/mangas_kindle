import urllib.request
import re
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

def get_nuxt_data(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if m:
            return json.loads(m.group(1)), html
        return None, html
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None, None

# 1. Load series from nuxt_home.json and nuxt_series_list.json
with open('C:/Users/ADM/.gemini/antigravity/brain/09aa231e-0657-4823-9dba-5ea2ef189d6a/scratch/nuxt_home.json', 'r', encoding='utf-8') as f:
    home_data = json.load(f)

def resolve_home(val):
    if isinstance(val, int) and 0 <= val < len(home_data):
        return home_data[val]
    return val

series_map = {}
for item in home_data:
    if isinstance(item, dict) and 'slug' in item and 'name' in item:
        s = {}
        for k, v in item.items():
            r = resolve_home(v)
            if isinstance(r, int) and 0 <= r < len(home_data):
                r = home_data[r]
            s[k] = r
        slug = s.get('slug')
        name = s.get('name')
        cover = s.get('cover')
        if slug and isinstance(slug, str) and isinstance(name, str) and cover and isinstance(cover, str) and cover.startswith('http'):
            if slug not in series_map:
                series_map[slug] = s

print(f"Extracted {len(series_map)} series from home page.")
for idx, (slug, s) in enumerate(list(series_map.items())[:10]):
    print(f"{idx+1}. {s['name']} (slug: {slug})")

