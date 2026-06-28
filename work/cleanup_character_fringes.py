from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_DIR = ROOT / "assets" / "characters"

ASSETS = [
    {
        "source": "main-character-idle-transparent.webp",
        "gif": "main-character-idle.gif",
        "clean": "main-character-idle-transparent-clean.webp",
        "preview": "main-character-idle-preview-clean.png",
        "label": "Main character",
    },
    {
        "source": "master-verion-idle-transparent.webp",
        "gif": "master-verion-idle.gif",
        "clean": "master-verion-idle-transparent-clean.webp",
        "preview": "master-verion-preview-clean.png",
        "label": "Master Verion",
    },
    {
        "source": "timedust-transparent.webp",
        "gif": "timedust.gif",
        "clean": "timedust-transparent-clean.webp",
        "preview": "timedust-preview-clean.png",
        "label": "Time Dust",
    },
    {
        "source": "echo-trick-transparent.webp",
        "gif": "echo-trick.gif",
        "clean": "echo-trick-transparent-clean.webp",
        "preview": "echo-trick-preview-clean.png",
        "label": "Echo Trick",
    },
]


def to_rgba(frame):
    return frame.convert("RGBA")


def clean_frame(frame):
    image = to_rgba(frame)
    arr = np.asarray(image).copy()
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3].astype(np.float32)

    alpha_img = Image.fromarray(alpha.astype(np.uint8), "L")
    min_alpha = np.asarray(alpha_img.filter(ImageFilter.MinFilter(5))).astype(np.float32)
    max_alpha = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(5))).astype(np.float32)

    luma = (0.2126 * rgb[:, :, 0]) + (0.7152 * rgb[:, :, 1]) + (0.0722 * rgb[:, :, 2])
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    edge_zone = (alpha > 0) & (alpha < 246) & (min_alpha < 48) & (max_alpha > 130)
    dark_matte = (luma < 92) | ((luma < 122) & (chroma < 26))

    alpha_fraction = np.clip(alpha / 255.0, 0.08, 1.0)
    decontaminated_rgb = np.clip(rgb / alpha_fraction[:, :, None], 0, 255)
    decontaminated_luma = (0.2126 * decontaminated_rgb[:, :, 0]) + (0.7152 * decontaminated_rgb[:, :, 1]) + (0.0722 * decontaminated_rgb[:, :, 2])
    likely_contamination = edge_zone & dark_matte & ((decontaminated_luma > luma + 12) | (alpha < 155))

    strength = np.clip((246 - alpha) / 180, 0.20, 0.92)
    strength = np.where(alpha < 95, np.maximum(strength, 0.82), strength)
    strength = strength[:, :, None]
    rgb = np.where(likely_contamination[:, :, None], rgb * (1 - strength) + decontaminated_rgb * strength, rgb)

    thin_dirty_edge = likely_contamination & (alpha < 88) & (luma < 72)
    alpha = np.where(thin_dirty_edge, alpha * 0.72, alpha)

    arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    arr[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def read_durations(asset):
    gif_path = CHARACTER_DIR / asset["gif"]
    if not gif_path.exists():
        return None
    with Image.open(gif_path) as gif:
        return [frame.info.get("duration", gif.info.get("duration", 40)) for frame in ImageSequence.Iterator(gif)]


def save_clean_animation(asset):
    source_path = CHARACTER_DIR / asset["source"]
    clean_path = CHARACTER_DIR / asset["clean"]
    durations = read_durations(asset)

    with Image.open(source_path) as src:
        frames = [clean_frame(frame) for frame in ImageSequence.Iterator(src)]

    if durations and len(durations) == len(frames):
        duration = durations
    else:
        duration = 40

    frames[0].save(
        clean_path,
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        format="WEBP",
        quality=95,
        alpha_quality=100,
        method=4,
        exact=True,
    )
    return frames


def checkerboard(size, tile=24):
    bg = Image.new("RGBA", size, (255, 255, 255, 255))
    draw = ImageDraw.Draw(bg)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle([x, y, x + tile - 1, y + tile - 1], fill=(210, 216, 224, 255))
    return bg


def fit_sprite(image, box_size):
    bbox = image.getbbox()
    if not bbox:
        return Image.new("RGBA", box_size, (0, 0, 0, 0))
    cropped = image.crop(bbox)
    scale = min(box_size[0] / cropped.width, box_size[1] / cropped.height)
    resized = cropped.resize((max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", box_size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((box_size[0] - resized.width) // 2, (box_size[1] - resized.height) // 2))
    return canvas


def make_preview(asset):
    source_path = CHARACTER_DIR / asset["source"]
    clean_path = CHARACTER_DIR / asset["clean"]
    preview_path = CHARACTER_DIR / asset["preview"]

    with Image.open(source_path) as src, Image.open(clean_path) as clean:
        before = to_rgba(next(ImageSequence.Iterator(src)))
        after = to_rgba(next(ImageSequence.Iterator(clean)))

    swatch_size = (260, 360)
    backgrounds = [
        ("Checker", checkerboard(swatch_size)),
        ("Light", Image.new("RGBA", swatch_size, (246, 248, 252, 255))),
        ("Dark", Image.new("RGBA", swatch_size, (28, 32, 43, 255))),
    ]
    before_sprite = fit_sprite(before, swatch_size)
    after_sprite = fit_sprite(after, swatch_size)

    width = swatch_size[0] * len(backgrounds) * 2
    header = 54
    canvas = Image.new("RGBA", (width, swatch_size[1] + header), (18, 22, 30, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((12, 10), f"{asset['label']} fringe cleanup preview: before / after", fill=(255, 255, 255, 255))

    x = 0
    for label, bg in backgrounds:
        for title, sprite in [("Before", before_sprite), ("After", after_sprite)]:
            panel = bg.copy()
            panel.alpha_composite(sprite)
            canvas.alpha_composite(panel, (x, header))
            draw.text((x + 10, header + 10), f"{label} {title}", fill=(20, 24, 32, 255) if label != "Dark" else (245, 247, 252, 255))
            x += swatch_size[0]

    canvas.convert("RGB").save(preview_path)


def main():
    for asset in ASSETS:
        frames = save_clean_animation(asset)
        make_preview(asset)
        print(f"{asset['source']} -> {asset['clean']} ({len(frames)} frames), preview {asset['preview']}")


if __name__ == "__main__":
    main()
