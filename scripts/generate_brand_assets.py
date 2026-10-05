import os
import base64
from PIL import Image
import numpy as np

def main():
    os.makedirs('public/brand', exist_ok=True)
    src_path = r'C:\Users\pc\.gemini\antigravity-ide\brain\36be2051-25f9-4199-a8a0-feff2834282f\.user_uploaded\media_1791068107314.png'
    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img).astype(float)
    bg = np.array([244.0, 248.5, 251.6])

    dist = np.sqrt(np.sum((arr[:, :, :3] - bg)**2, axis=2))
    t0 = 12.0
    t1 = 65.0
    alpha_raw = np.clip((dist - t0) / (t1 - t0), 0.0, 1.0)
    alpha = alpha_raw * alpha_raw * (3 - 2 * alpha_raw)

    # 1. ICON CROP (rows 28 to 196, cols 394 to 618)
    ir_min, ir_max = 28, 196
    ic_min, ic_max = 394, 618
    pad = 4

    icon_arr = arr[ir_min-pad:ir_max+pad+1, ic_min-pad:ic_max+pad+1].copy()
    icon_alpha = alpha[ir_min-pad:ir_max+pad+1, ic_min-pad:ic_max+pad+1].copy()

    # Calculate luminance of original icon
    lum = (0.299 * icon_arr[:, :, 0] + 0.587 * icon_arr[:, :, 1] + 0.114 * icon_arr[:, :, 2]) / 255.0

    # Colorize to Deep Burgundy (#722F37)
    burgundy_base = np.array([114.0, 47.0, 55.0]) # #722F37
    burgundy_light = np.array([150.0, 65.0, 75.0])

    icon_burgundy = np.zeros_like(icon_arr)
    mask = icon_alpha > 0.01
    for c in range(3):
        blended = burgundy_base[c] + (burgundy_light[c] - burgundy_base[c]) * (lum[mask] ** 0.8)
        icon_burgundy[mask, c] = np.clip(blended, 0, 255)
    icon_burgundy[:, :, 3] = icon_alpha * 255

    icon_img = Image.fromarray(icon_burgundy.astype(np.uint8), 'RGBA')
    icon_img.save('public/brand/habitra-icon.png')
    icon_2x = icon_img.resize((icon_img.width * 2, icon_img.height * 2), Image.Resampling.LANCZOS)
    icon_2x.save('public/brand/habitra-icon@2x.png')

    # 2. WORDMARK (rows 217 to 295, cols 326 to 689)
    wr_min, wr_max = 217, 295
    wc_min, wc_max = 326, 689

    word_arr = arr[wr_min-pad:wr_max+pad+1, wc_min-pad:wc_max+pad+1].copy()
    word_alpha = alpha[wr_min-pad:wr_max+pad+1, wc_min-pad:wc_max+pad+1].copy()
    w_mask = word_alpha > 0.01

    # Dark Wordmark: Solid Warm Brown #2E1A11 = (46, 26, 17)
    word_dark = np.zeros_like(word_arr)
    word_dark[w_mask, 0] = 46
    word_dark[w_mask, 1] = 26
    word_dark[w_mask, 2] = 17
    word_dark[:, :, 3] = word_alpha * 255
    word_dark_img = Image.fromarray(word_dark.astype(np.uint8), 'RGBA')
    word_dark_img.save('public/brand/habitra-wordmark-dark.png')
    word_dark_2x = word_dark_img.resize((word_dark_img.width * 2, word_dark_img.height * 2), Image.Resampling.LANCZOS)
    word_dark_2x.save('public/brand/habitra-wordmark-dark@2x.png')

    # Light Wordmark: Solid Pure White #FFFFFF = (255, 255, 255)
    word_light = np.zeros_like(word_arr)
    word_light[w_mask, 0] = 255
    word_light[w_mask, 1] = 255
    word_light[w_mask, 2] = 255
    word_light[:, :, 3] = word_alpha * 255
    word_light_img = Image.fromarray(word_light.astype(np.uint8), 'RGBA')
    word_light_img.save('public/brand/habitra-wordmark-light.png')
    word_light_2x = word_light_img.resize((word_light_img.width * 2, word_light_img.height * 2), Image.Resampling.LANCZOS)
    word_light_2x.save('public/brand/habitra-wordmark-light@2x.png')

    # 3. HORIZONTAL COMBINATIONS AT 2X
    target_h = 160
    icon_scale = (target_h - 24) / icon_2x.height
    icon_w = int(round(icon_2x.width * icon_scale))
    icon_h = int(round(icon_2x.height * icon_scale))
    icon_scaled = icon_2x.resize((icon_w, icon_h), Image.Resampling.LANCZOS)

    word_target_h = 88
    word_scale = word_target_h / word_dark_2x.height
    word_w = int(round(word_dark_2x.width * word_scale))
    word_h = int(round(word_dark_2x.height * word_scale))
    word_dark_scaled = word_dark_2x.resize((word_w, word_h), Image.Resampling.LANCZOS)
    word_light_scaled = word_light_2x.resize((word_w, word_h), Image.Resampling.LANCZOS)

    gap = 32
    total_w = icon_w + gap + word_w
    pad_x = 20

    # Horizontal Dark (Deep Burgundy icon + Espresso Mocha text)
    h_dark = Image.new('RGBA', (total_w + pad_x * 2, target_h), (0, 0, 0, 0))
    y_icon = (target_h - icon_h) // 2
    y_word = (target_h - word_h) // 2
    h_dark.paste(icon_scaled, (pad_x, y_icon), icon_scaled)
    h_dark.paste(word_dark_scaled, (pad_x + icon_w + gap, y_word), word_dark_scaled)
    h_dark.save('public/brand/habitra-logo-horizontal@2x.png')
    h_dark.resize((h_dark.width // 2, h_dark.height // 2), Image.Resampling.LANCZOS).save('public/brand/habitra-logo-horizontal.png')

    # Horizontal Light (Deep Burgundy icon + Cosmic Latte ivory text for dark mocha backgrounds)
    h_light = Image.new('RGBA', (total_w + pad_x * 2, target_h), (0, 0, 0, 0))
    h_light.paste(icon_scaled, (pad_x, y_icon), icon_scaled)
    h_light.paste(word_light_scaled, (pad_x + icon_w + gap, y_word), word_light_scaled)
    h_light.save('public/brand/habitra-logo-horizontal-light@2x.png')
    h_light.resize((h_light.width // 2, h_light.height // 2), Image.Resampling.LANCZOS).save('public/brand/habitra-logo-horizontal-light.png')

    # 4. STACKED COMBINATIONS
    stacked_w = max(icon_2x.width, word_dark_2x.width) + 60
    v_gap = 28
    stacked_h = icon_2x.height + v_gap + word_dark_2x.height + 40

    # Stacked Dark
    s_dark = Image.new('RGBA', (stacked_w, stacked_h), (0, 0, 0, 0))
    x_icon = (stacked_w - icon_2x.width) // 2
    x_word = (stacked_w - word_dark_2x.width) // 2
    s_dark.paste(icon_2x, (x_icon, 20), icon_2x)
    s_dark.paste(word_dark_2x, (x_word, 20 + icon_2x.height + v_gap), word_dark_2x)
    s_dark.save('public/brand/habitra-logo-stacked@2x.png')
    s_dark.resize((stacked_w // 2, stacked_h // 2), Image.Resampling.LANCZOS).save('public/brand/habitra-logo-stacked.png')

    # Stacked Light
    s_light = Image.new('RGBA', (stacked_w, stacked_h), (0, 0, 0, 0))
    s_light.paste(icon_2x, (x_icon, 20), icon_2x)
    s_light.paste(word_light_2x, (x_word, 20 + icon_2x.height + v_gap), word_light_2x)
    s_light.save('public/brand/habitra-logo-stacked-light@2x.png')
    s_light.resize((stacked_w // 2, stacked_h // 2), Image.Resampling.LANCZOS).save('public/brand/habitra-logo-stacked-light.png')

    # 5. FAVICON & SVGs
    def make_favicon_png(size, out_path):
        bg = Image.new('RGBA', (size, size), (36, 24, 20, 255)) # Dark Mocha #241814
        target_dim = int(size * 0.76)
        scale = target_dim / max(icon_2x.width, icon_2x.height)
        new_w = int(round(icon_2x.width * scale))
        new_h = int(round(icon_2x.height * scale))
        resized = icon_2x.resize((new_w, new_h), Image.Resampling.LANCZOS)
        pos = ((size - new_w) // 2, (size - new_h) // 2)
        bg.paste(resized, pos, resized)
        bg.save(out_path)

    make_favicon_png(64, 'public/favicon.png')
    make_favicon_png(192, 'public/favicon-192.png')
    make_favicon_png(512, 'public/favicon-512.png')

    with open('public/brand/habitra-icon@2x.png', 'rb') as f:
        b64_icon = base64.b64encode(f.read()).decode('utf-8')

    svg_favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="20" fill="#2E1A11" />
  <image href="data:image/png;base64,{b64_icon}" x="16" y="16" width="96" height="96" preserveAspectRatio="xMidYMid meet" />
</svg>'''
    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_favicon)

    # 6. SVG files
    with open('public/brand/habitra-icon.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {icon_2x.width} {icon_2x.height}" width="{icon_2x.width}" height="{icon_2x.height}">
  <image href="data:image/png;base64,{b64_icon}" width="{icon_2x.width}" height="{icon_2x.height}" />
</svg>''')

    # Wordmark Dark SVG
    with open('public/brand/habitra-wordmark-dark@2x.png', 'rb') as f:
        b64_w_dark = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-wordmark-dark.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_dark_2x.width} {word_dark_2x.height}" width="{word_dark_2x.width}" height="{word_dark_2x.height}">
  <image href="data:image/png;base64,{b64_w_dark}" width="{word_dark_2x.width}" height="{word_dark_2x.height}" />
</svg>''')

    # Wordmark Light SVG
    with open('public/brand/habitra-wordmark-light@2x.png', 'rb') as f:
        b64_w_light = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-wordmark-light.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {word_light_2x.width} {word_light_2x.height}" width="{word_light_2x.width}" height="{word_light_2x.height}">
  <image href="data:image/png;base64,{b64_w_light}" width="{word_light_2x.width}" height="{word_light_2x.height}" />
</svg>''')

    # Horizontal SVG (Light and Dark)
    with open('public/brand/habitra-logo-horizontal@2x.png', 'rb') as f:
        b64_h_dark = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-logo-horizontal.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {h_dark.width} {h_dark.height}" width="{h_dark.width}" height="{h_dark.height}">
  <image href="data:image/png;base64,{b64_h_dark}" width="{h_dark.width}" height="{h_dark.height}" />
</svg>''')

    with open('public/brand/habitra-logo-horizontal-light@2x.png', 'rb') as f:
        b64_h_light = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-logo-horizontal-light.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {h_light.width} {h_light.height}" width="{h_light.width}" height="{h_light.height}">
  <image href="data:image/png;base64,{b64_h_light}" width="{h_light.width}" height="{h_light.height}" />
</svg>''')

    # Stacked SVG
    with open('public/brand/habitra-logo-stacked@2x.png', 'rb') as f:
        b64_s_dark = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-logo-stacked.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s_dark.width} {s_dark.height}" width="{s_dark.width}" height="{s_dark.height}">
  <image href="data:image/png;base64,{b64_s_dark}" width="{s_dark.width}" height="{s_dark.height}" />
</svg>''')

    with open('public/brand/habitra-logo-stacked-light@2x.png', 'rb') as f:
        b64_s_light = base64.b64encode(f.read()).decode('utf-8')
    with open('public/brand/habitra-logo-stacked-light.svg', 'w', encoding='utf-8') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s_light.width} {s_light.height}" width="{s_light.width}" height="{s_light.height}">
  <image href="data:image/png;base64,{b64_s_light}" width="{s_light.width}" height="{s_light.height}" />
</svg>''')

    # 7. OpenGraph Social Share Preview (1200 x 630)
    og_img = Image.new('RGBA', (1200, 630), (36, 24, 20, 255)) # Dark Mocha #241814
    s_scale = 380 / s_light.height
    new_sw = int(round(s_light.width * s_scale))
    new_sh = int(round(s_light.height * s_scale))
    s_resized = s_light.resize((new_sw, new_sh), Image.Resampling.LANCZOS)
    og_img.paste(s_resized, ((1200 - new_sw) // 2, (630 - new_sh) // 2 - 20), s_resized)
    og_img.save('public/og-image.png')

    print("All Cosmic Latte, Mocha Cream & Deep Burgundy brand assets regenerated successfully!")

if __name__ == '__main__':
    main()
