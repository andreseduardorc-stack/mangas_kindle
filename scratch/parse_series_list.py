import json

with open('C:/Users/ADM/OneDrive - Instituto Profesional San Sebastián/Escritorio\mangas/scratch/nuxt_series_list.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def resolve(val):
    if isinstance(val, int) and 0 <= val < len(data):
        return data[val]
    return val

series = []
for idx, item in enumerate(data):
    if isinstance(item, dict) and 'slug' in item and 'name' in item:
        s = {}
        for k, v in item.items():
            val = resolve(v)
            if isinstance(val, int) and 0 <= val < len(data):
                val = data[val]
            s[k] = val
        series.append(s)

print(f"Total series found: {len(series)}")
for s in series[:15]:
    print(s.get('id'), "|", s.get('name'), "|", s.get('slug'), "|", s.get('cover'))

