import urllib.request
import re
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://olympusxyz.com/'
}

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching json {url}: {e}")
        return None

def fetch_html(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching html {url}: {e}")
        return ""

def fetch_chapter_pages(series_slug, ch_num):
    url = f"https://olympusxyz.com/series/comic-{series_slug}/capitulo/{ch_num}"
    html = fetch_html(url)
    if not html:
        return []
    imgs = re.findall(r'https://media\.imagesolymp\.xyz/comics/[^"\'\s]+\.webp', html)
    page_imgs = [i for i in imgs if '/covers/' not in i and '/teams/' not in i]
    seen = set()
    pages = []
    for p in page_imgs:
        if p not in seen:
            seen.add(p)
            pages.append(p)
    return pages

# Series to process
series_slugs = [
    ('el-hijo20-225-de-la-espada13424', 'El hijo menor del maestro de la espada'),
    ('el-villano-loco-recupera-la-cordura', 'El villano loco recupera la cordura'),
    ('demonio-de-la-lanza-inigualable', 'Demonio de la lanza inigualable'),
    ('el-regresor-y-la-santa-ciega', 'El Regresor y la Santa Ciega'),
    ('copiando-habilidades-con-afinidad', '¡Copiando habilidades con Afinidad!'),
    ('toma-un-grimorio-y-conviertete-en-mago', 'Toma un Grimorio y Conviértete en Mago'),
    ('solo-swordmaster', 'Solo Swordmaster'),
    ('mi-novia-ha-regresado-como-una-dragona', 'Mi Novia ha Regresado Como una Dragona'),
    ('pick-me-up-gacha-infinito-20261107-080742039', 'Pick me up, Gacha Infinito'),
    ('la-leyenda-de-cultivacion-de-un-regresor-20261107-080746709', 'La leyenda de cultivación de un regresor'),
    ('acero-sangre-murim', '¡¡Acero, Sangre, Murim!!'),
    ('al-de20-225-n-medico', 'Al demonio con ser un santo, soy un medico')
]

olympus_mangas = []
olympus_chapters_map = {}

for slug, fallback_title in series_slugs:
    print(f"\nProcessing {fallback_title} ({slug})...")
    series_url = f"https://olympusxyz.com/series/comic-{slug}"
    html = fetch_html(series_url)
    
    # Extract nuxt data
    summary = ""
    cover_url = ""
    title = fallback_title
    status = "ongoing"
    genres = ["Acción", "Fantasía", "Webtoon"]
    chapters_count = 1

    m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if m:
        try:
            nuxt_data = json.loads(m.group(1))
            # Find cover
            for x in nuxt_data:
                if isinstance(x, str) and 'media.imagesolymp.xyz/comics/covers/' in x and x.endswith('.webp'):
                    cover_url = x
                    break
            # Find summary (long string)
            for x in nuxt_data:
                if isinstance(x, str) and len(x) > 60 and not x.startswith('http') and not x.startswith('/'):
                    if 'Runcandel' in x or 'historia' in x or 'mundo' in x or 'vida' in x or 'muerte' in x or len(x) > 100:
                        summary = x.strip()
                        break
        except Exception as err:
            print("Nuxt parse error:", err)

    if not cover_url:
        cover_url = f"https://media.imagesolymp.xyz/comics/covers/default.webp"

    # Fetch chapters list via API
    api_url = f"https://olympusxyz.com/api/series/{slug}/chapters"
    api_res = fetch_json(api_url)
    chapters_data = api_res.get('data', []) if api_res and isinstance(api_res, dict) else []
    
    if len(chapters_data) > 0:
        chapters_count = len(chapters_data)
    else:
        chapters_count = 20

    # Fetch real pages for Chapter 1
    print(f"  Fetching chapter 1 pages...")
    ch1_pages = fetch_chapter_pages(slug, 1)
    print(f"  Ch 1 pages found: {len(ch1_pages)}")

    ch2_pages = []
    if chapters_count > 1:
        time.sleep(0.5)
        ch2_pages = fetch_chapter_pages(slug, 2)
        print(f"  Ch 2 pages found: {len(ch2_pages)}")

    manga_id = f"olympus-{slug}"
    
    # Build Manga object
    manga_obj = {
        "id": manga_id,
        "title": title,
        "altTitle": "Olympus Scanlation Oficial",
        "author": "Olympus Scans",
        "artist": "Olympus",
        "coverUrl": cover_url,
        "description": summary or f"{title}. Cómic y Manhwa oficial en español disponible en Olympus Scanlation.",
        "status": "ongoing",
        "type": "manhwa",
        "genres": ["Acción", "Fantasía", "Aventura", "Webtoon a color", "Olympus"],
        "chaptersCount": chapters_count,
        "source": "olympus",
        "defaultReadingMode": "webtoon-vertical",
        "inLibrary": True,
        "addedAt": int(time.time() * 1000),
        "lastReadAt": int(time.time() * 1000),
        "currentChapterId": f"{manga_id}-ch-1",
        "currentPage": 1,
        "totalPagesInCurrentChapter": len(ch1_pages) if ch1_pages else 15,
        "progressPercent": 0,
        "downloaded": True,
        "olympusSlug": slug
    }
    olympus_mangas.append(manga_obj)

    # Build Chapters
    ch_list = []
    # Add chapter 1
    ch_list.append({
        "id": f"{manga_id}-ch-1",
        "mangaId": manga_id,
        "chapterNumber": "1",
        "title": f"Capítulo 1",
        "language": "es",
        "pagesCount": len(ch1_pages) if ch1_pages else 1,
        "pages": ch1_pages,
        "publishDate": "2024-01-01",
        "scanlationGroup": "Olympus Scanlation"
    })
    
    if ch2_pages:
        ch_list.append({
            "id": f"{manga_id}-ch-2",
            "mangaId": manga_id,
            "chapterNumber": "2",
            "title": f"Capítulo 2",
            "language": "es",
            "pagesCount": len(ch2_pages),
            "pages": ch2_pages,
            "publishDate": "2024-01-08",
            "scanlationGroup": "Olympus Scanlation"
        })

    # Add other chapters from chapters_data if any
    for ch_item in chapters_data:
        ch_name = str(ch_item.get('name', ''))
        if ch_name not in ['1', '2']:
            ch_list.append({
                "id": f"{manga_id}-ch-{ch_name}",
                "mangaId": manga_id,
                "chapterNumber": ch_name,
                "title": f"Capítulo {ch_name}",
                "language": "es",
                "pagesCount": 25,
                "pages": [], # loaded dynamically
                "publishDate": ch_item.get('published_at', '').split('T')[0] if ch_item.get('published_at') else '2024-01-01',
                "scanlationGroup": "Olympus Scanlation"
            })

    # sort chapters by numeric chapterNumber
    ch_list.sort(key=lambda x: float(re.findall(r'\d+(?:\.\d+)?', x['chapterNumber'])[0]) if re.findall(r'\d+(?:\.\d+)?', x['chapterNumber']) else 0)
    olympus_chapters_map[manga_id] = ch_list

# Save to JSON
with open('C:/Users/ADM/OneDrive - Instituto Profesional San Sebastián/Escritorio/mangas/scratch/olympus_extracted.json', 'w', encoding='utf-8') as f:
    json.dump({
        "mangas": olympus_mangas,
        "chapters": olympus_chapters_map
    }, f, indent=2, ensure_ascii=False)

print("\nSUCCESS! Saved scratch/olympus_extracted.json")

