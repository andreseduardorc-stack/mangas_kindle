import json

with open('scratch/olympus_extracted.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Filter out any with 0 pages in Ch 1
mangas = []
chapters_map = {}

for m in data['mangas']:
    m_id = m['id']
    chs = data['chapters'].get(m_id, [])
    if chs and len(chs[0]['pages']) > 0:
        mangas.append(m)
        chapters_map[m_id] = chs

print(f"Valid mangas with real pages: {len(mangas)}")

ts_content = f"""// Real Manga and Manhwa content extracted directly from Olympus (https://olympusxyz.com/)
import type {{ Manga, Chapter }} from '../types';

export const OLYMPUS_MANGAS: Manga[] = {json.dumps(mangas, indent=2, ensure_ascii=False)};

export const OLYMPUS_CHAPTERS: Record<string, Chapter[]> = {json.dumps(chapters_map, indent=2, ensure_ascii=False)};
"""

import os

os.makedirs('src/data', exist_ok=True)
with open('src/data/olympusMangaData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Generated src/data/olympusMangaData.ts successfully!")
