import urllib.request
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

url = 'https://olympusxyz.com/series/comic-el-hijo20-225-de-la-espada13424/capitulo/1'
print(f"Fetching chapter: {url}...")
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Status 200, length: {len(html)}")

        # Check __NUXT_DATA__
        m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if m:
            data = json.loads(m.group(1))
            with open('C:/Users/ADM/.gemini/antigravity/brain/09aa231e-0657-4823-9dba-5ea2ef189d6a/scratch/nuxt_chapter.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("Saved nuxt_chapter.json!")

            # Look for image URLs
            strings = [x for x in data if isinstance(x, str)]
            img_urls = [s for s in strings if any(ext in s.lower() for ext in ['.webp', '.jpg', '.jpeg', '.png'])]
            print(f"Found {len(img_urls)} image URLs in chapter!")
            for u in img_urls[:15]:
                print("  ", u)

        # Also search for img src in HTML
        imgs = re.findall(r'<img[^>]*src="([^"]+)"', html)
        print("Imgs in HTML:", imgs[:10])

except Exception as e:
    print("Error:", e)

