import urllib.request
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

# In nuxt_home.json, let's see how new_chapters are linked!
with open('C:/Users/ADM/.gemini/antigravity/brain/09aa231e-0657-4823-9dba-5ea2ef189d6a/scratch/nuxt_home.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find any url or path containing capitulo or chapter
chapter_links = [x for x in data if isinstance(x, str) and ('capitulo' in x or 'chapter' in x)]
print("Chapter strings in home nuxt:", chapter_links[:20])

for x in data:
    if isinstance(x, str) and '/series/' in x:
        print("Series link:", x)
    if isinstance(x, str) and ('/capitulo/' in x or '/leer/' in x or '/read/' in x):
        print("Reader link:", x)

