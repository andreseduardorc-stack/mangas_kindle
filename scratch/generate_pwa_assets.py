import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public/icons', exist_ok=True)
os.makedirs('public/screenshots', exist_ok=True)

def draw_kindle_icon(size, is_maskable=False):
    # Background
    bg_color = (44, 43, 41) # Kindle charcoal #2c2b29
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    scale = size / 512.0
    safe_margin = int(size * 0.1) if is_maskable else 0

    # Book / Screen frame in subtle paper color
    paper_color = (251, 248, 241) # #fbf8f1
    inner_pad = int(80 * scale)
    book_rect = [
        inner_pad + safe_margin,
        int(60 * scale) + safe_margin,
        size - inner_pad - safe_margin,
        size - int(70 * scale) - safe_margin
    ]
    corner_radius = int(24 * scale)
    draw.rounded_rectangle(book_rect, radius=corner_radius, fill=paper_color)

    # Book fold spine line
    spine_x = size // 2
    draw.line(
        [(spine_x, book_rect[1] + int(20 * scale)), (spine_x, book_rect[3] - int(20 * scale))],
        fill=(220, 215, 203),
        width=int(4 * scale)
    )

    # Simulated manga panels inside left page
    left_x1 = book_rect[0] + int(20 * scale)
    left_x2 = spine_x - int(15 * scale)
    draw.rounded_rectangle(
        [left_x1, book_rect[1] + int(30 * scale), left_x2, book_rect[1] + int(140 * scale)],
        radius=int(8 * scale),
        fill=(238, 235, 222),
        outline=(50, 48, 44),
        width=int(3 * scale)
    )
    draw.rounded_rectangle(
        [left_x1, book_rect[1] + int(155 * scale), left_x2, book_rect[3] - int(30 * scale)],
        radius=int(8 * scale),
        fill=(238, 235, 222),
        outline=(50, 48, 44),
        width=int(3 * scale)
    )

    # Simulated manga panels inside right page
    right_x1 = spine_x + int(15 * scale)
    right_x2 = book_rect[2] - int(20 * scale)
    draw.rounded_rectangle(
        [right_x1, book_rect[1] + int(30 * scale), right_x2, book_rect[3] - int(30 * scale)],
        radius=int(8 * scale),
        fill=(238, 235, 222),
        outline=(50, 48, 44),
        width=int(3 * scale)
    )

    # Bookmark ribbon on top right corner
    ribbon_w = int(36 * scale)
    ribbon_h = int(60 * scale)
    rx = right_x2 - int(45 * scale)
    ry = book_rect[1]
    ribbon_pts = [
        (rx, ry),
        (rx + ribbon_w, ry),
        (rx + ribbon_w, ry + ribbon_h),
        (rx + ribbon_w // 2, ry + int(ribbon_h * 0.75)),
        (rx, ry + ribbon_h)
    ]
    draw.polygon(ribbon_pts, fill=(180, 83, 9)) # amber ribbon

    # Subtle "kindle" style lettering below book if not maskable
    if not is_maskable:
        dot_r = int(4 * scale)
        for i in range(5):
            cx = size // 2 - int(40 * scale) + i * int(20 * scale)
            cy = size - int(35 * scale)
            draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(160, 155, 145))

    return img

# Generate icons
print("Generating 512x512 standard icon...")
draw_kindle_icon(512, False).save('public/icons/icon-512.png', 'PNG')

print("Generating 192x192 standard icon...")
draw_kindle_icon(192, False).save('public/icons/icon-192.png', 'PNG')

print("Generating 512x512 maskable icon...")
draw_kindle_icon(512, True).save('public/icons/icon-maskable-512.png', 'PNG')

print("Generating 192x192 maskable icon...")
draw_kindle_icon(192, True).save('public/icons/icon-maskable-192.png', 'PNG')

print("Generating 180x180 Apple Touch Icon...")
draw_kindle_icon(180, False).save('public/icons/apple-touch-icon.png', 'PNG')

# Screenshots for PWABuilder store readiness
print("Generating mobile screenshot (720x1280)...")
mobile_ss = Image.new('RGB', (720, 1280), (38, 37, 35))
m_draw = ImageDraw.Draw(mobile_ss)
# Phone bezel & kindle paper UI
m_draw.rounded_rectangle([20, 40, 700, 1240], radius=32, fill=(247, 244, 237), outline=(80, 78, 73), width=4)
# Header bar
m_draw.rectangle([20, 40, 700, 130], fill=(240, 236, 226))
# Mock title
m_draw.text((50, 70), "kindle MANGA (Español)", fill=(26, 25, 24))
# Mock cards
for row in range(3):
    for col in range(2):
        x1 = 60 + col * 320
        y1 = 170 + row * 340
        m_draw.rounded_rectangle([x1, y1, x1 + 280, y1 + 310], radius=16, fill=(230, 224, 210), outline=(200, 194, 180), width=2)
mobile_ss.save('public/screenshots/screenshot-mobile.png', 'PNG')

print("Generating desktop screenshot (1280x720)...")
desk_ss = Image.new('RGB', (1280, 720), (38, 37, 35))
d_draw = ImageDraw.Draw(desk_ss)
d_draw.rounded_rectangle([40, 30, 1240, 690], radius=24, fill=(247, 244, 237), outline=(80, 78, 73), width=4)
# Header
d_draw.rectangle([40, 30, 1240, 110], fill=(240, 236, 226))
d_draw.text((80, 55), "kindle MANGA - Catálogo Completo Olympus", fill=(26, 25, 24))
for col in range(5):
    x1 = 80 + col * 230
    d_draw.rounded_rectangle([x1, 140, x1 + 200, 480], radius=16, fill=(230, 224, 210), outline=(200, 194, 180), width=2)
desk_ss.save('public/screenshots/screenshot-desktop.png', 'PNG')

print("All PWABuilder icons and screenshots generated successfully!")

