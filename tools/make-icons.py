"""Genera los iconos PNG para la PWA (192, 512 y maskable)."""
from PIL import Image, ImageDraw
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
SS = 4  # supersampling


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def make_icon(size, padding_ratio=0.0):
    S = size * SS
    # fondo degradado
    bg = Image.new('RGB', (S, S))
    d = ImageDraw.Draw(bg)
    top = (143, 214, 255)
    bottom = (27, 127, 212)
    for y in range(S):
        d.line([(0, y), (S, y)], fill=lerp(top, bottom, y / max(1, S - 1)))
    # brillo superior
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-S * 0.3, -S * 0.55, S * 0.9, S * 0.35], fill=(255, 255, 255, 90))
    bg = Image.alpha_composite(bg.convert('RGBA'), glow)

    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    scale = 1.0 - padding_ratio
    cx = cy = S / 2
    def P(x, y, r):
        return [cx + (x - 0.5) * S * scale - r * S * scale,
                cy + (y - 0.5) * S * scale - r * S * scale,
                cx + (x - 0.5) * S * scale + r * S * scale,
                cy + (y - 0.5) * S * scale + r * S * scale]

    fur = (184, 195, 216)
    fur_dark = (109, 124, 153)
    inner = (255, 195, 209)
    belly = (242, 246, 255)
    w = max(2, int(S * 0.012))

    # orejas
    d.ellipse(P(0.293, 0.297, 0.14), fill=fur, outline=fur_dark, width=w)
    d.ellipse(P(0.707, 0.297, 0.14), fill=fur, outline=fur_dark, width=w)
    d.ellipse(P(0.293, 0.308, 0.082), fill=inner)
    d.ellipse(P(0.707, 0.308, 0.082), fill=inner)
    # cabeza
    d.ellipse(P(0.5, 0.558, 0.281), fill=fur, outline=fur_dark, width=w)
    d.ellipse(P(0.5, 0.66, 0.168), fill=belly)
    # ojos
    d.ellipse(P(0.398, 0.52, 0.07), fill='white')
    d.ellipse(P(0.602, 0.52, 0.07), fill='white')
    d.ellipse(P(0.406, 0.53, 0.037), fill=(38, 49, 63))
    d.ellipse(P(0.61, 0.53, 0.037), fill=(38, 49, 63))
    d.ellipse(P(0.391, 0.512, 0.014), fill='white')
    d.ellipse(P(0.595, 0.512, 0.014), fill='white')
    # nariz y boca
    d.ellipse(P(0.5, 0.656, 0.033), fill=(242, 120, 156))
    d.arc(P(0.5, 0.71, 0.07), start=20, end=160, fill=(122, 59, 82), width=max(2, int(S * 0.016)))
    # mejillas
    cheek = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cheek)
    cd.ellipse(P(0.317, 0.656, 0.05), fill=(255, 157, 180, 120))
    cd.ellipse(P(0.683, 0.656, 0.05), fill=(255, 157, 180, 120))
    layer = Image.alpha_composite(layer, cheek)

    icon = Image.alpha_composite(bg, layer)
    mask = rounded_mask(S, int(S * 0.22))
    icon.putalpha(mask)
    return icon.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
make_icon(192).save(os.path.join(OUT, 'icon-192.png'))
make_icon(512).save(os.path.join(OUT, 'icon-512.png'))
make_icon(512, padding_ratio=0.22).save(os.path.join(OUT, 'icon-maskable-512.png'))
print('Iconos generados en', os.path.abspath(OUT))
