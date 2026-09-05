import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs('icons', exist_ok=True)

def create_dunes_icon(size):
    # Imagen RGBA de alta resolución
    img = Image.new('RGBA', (size, size), (8, 9, 13, 255))
    draw = ImageDraw.Draw(img)

    # Margen y radio de esquinas redondeadas
    r = size // 6
    margin = size // 24
    
    # Fondo con borde sutil dorado
    # Dibujar resplandor rojo vino en el centro
    center = size // 2
    for radius in range(center, 0, -2):
        alpha = int(70 * (1 - (radius / center)**1.2))
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(123, 24, 36, alpha)
        )

    # Marco exterior dorado
    border_w = max(2, size // 48)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        outline=(212, 175, 55, 230),
        width=border_w
    )

    # Dibujo de Luna Creciente dorada y Frasco de Perfume Minimalista
    # Luna creciente
    moon_r = size // 4
    moon_cx = center
    moon_cy = int(center * 0.88)
    
    # Círculo base dorado
    draw.ellipse(
        [moon_cx - moon_r, moon_cy - moon_r, moon_cx + moon_r, moon_cy + moon_r],
        fill=(243, 208, 104, 255)
    )
    # Círculo recortador para dar efecto creciente
    cut_offset = int(moon_r * 0.45)
    draw.ellipse(
        [moon_cx - moon_r + cut_offset, moon_cy - moon_r - cut_offset//3, moon_cx + moon_r + cut_offset, moon_cy + moon_r - cut_offset//3],
        fill=(18, 14, 20, 255)
    )

    # Frasco estilizado de perfume en el centro
    bottle_w = int(size * 0.28)
    bottle_h = int(size * 0.32)
    bx0 = center - bottle_w // 2
    by0 = int(size * 0.48)
    bx1 = center + bottle_w // 2
    by1 = by0 + bottle_h

    # Tapón dorado
    cap_w = int(bottle_w * 0.45)
    cap_h = int(bottle_h * 0.22)
    cx0 = center - cap_w // 2
    cy0 = by0 - cap_h - max(1, size // 60)
    cx1 = center + cap_w // 2
    cy1 = by0

    draw.rectangle([cx0, cy0, cx1, cy1], fill=(245, 215, 127, 255), outline=(170, 130, 34, 255), width=max(1, size // 80))

    # Cuerpo del frasco (Rojo vino con borde dorado)
    draw.rounded_rectangle(
        [bx0, by0, bx1, by1],
        radius=max(4, size // 30),
        fill=(123, 24, 36, 230),
        outline=(212, 175, 55, 255),
        width=max(2, size // 60)
    )

    # Letra 'D' dorada en el centro del frasco
    # Dibujar 'D' con líneas y arco
    d_top = by0 + int(bottle_h * 0.25)
    d_bot = by1 - int(bottle_h * 0.25)
    d_left = center - int(bottle_w * 0.22)
    d_right = center + int(bottle_w * 0.22)
    lw = max(2, size // 55)

    # Tallo vertical
    draw.line([d_left, d_top, d_left, d_bot], fill=(243, 208, 104, 255), width=lw)
    # Arco de la D
    draw.arc([d_left - int(bottle_w * 0.1), d_top, d_right, d_bot], start=270, end=90, fill=(243, 208, 104, 255), width=lw)
    draw.line([d_left, d_top, d_left + int(bottle_w * 0.15), d_top], fill=(243, 208, 104, 255), width=lw)
    draw.line([d_left, d_bot, d_left + int(bottle_w * 0.15), d_bot], fill=(243, 208, 104, 255), width=lw)

    # Texto inferior "DUNES" si tamaño >= 180
    if size >= 180:
        # Puntos de acento decorativo
        dot_r = max(2, size // 80)
        draw.ellipse([center - size//6 - dot_r, int(size * 0.88) - dot_r, center - size//6 + dot_r, int(size * 0.88) + dot_r], fill=(212, 175, 55, 255))
        draw.ellipse([center + size//6 - dot_r, int(size * 0.88) - dot_r, center + size//6 + dot_r, int(size * 0.88) + dot_r], fill=(212, 175, 55, 255))

    return img

print("Generando iconos de DUNES PARFUMS...")
icon192 = create_dunes_icon(192)
icon192.save('icons/icon-192.png', 'PNG')

icon512 = create_dunes_icon(512)
icon512.save('icons/icon-512.png', 'PNG')

apple_icon = create_dunes_icon(180)
apple_icon.save('icons/apple-touch-icon.png', 'PNG')

print("Iconos generados exitosamente en /icons:")
print(" - icons/icon-192.png")
print(" - icons/icon-512.png")
print(" - icons/apple-touch-icon.png")
