import urllib.request
import re
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

def fetch_chapter_pages(series_slug, ch_num):
    url = f"https://olympusxyz.com/series/comic-{series_slug}/capitulo/{ch_num}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
        
        # Look for media.imagesolymp.xyz URLs
        imgs = re.findall(r'https://media\.imagesolymp\.xyz/comics/[^"\'\s]+\.webp', html)
        # filter out covers/teams
        page_imgs = [i for i in imgs if '/covers/' not in i and '/teams/' not in i]
        # remove duplicates preserving order
        seen = set()
        pages = []
        for p in page_imgs:
            if p not in seen:
                seen.add(p)
                pages.append(p)
        return pages
    except Exception as e:
        print(f"Error fetching pages for {series_slug} ch {ch_num}: {e}")
        return []

test_slugs = [
    'el-hijo20-225-de-la-espada13424',
    'el-villano-loco-recupera-la-cordura',
    'demonio-de-la-lanza-inigualable'
]

for s in test_slugs:
    p = fetch_chapter_pages(s, 1)
    print(f"Slug: {s} -> {len(p)} pages found!")
    if p:
        print("  Page 1:", p[0])

