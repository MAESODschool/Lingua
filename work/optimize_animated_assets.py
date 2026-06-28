from pathlib import Path

from PIL import Image, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_DIR = ROOT / "assets" / "characters"
BACKGROUND_DIR = ROOT / "assets" / "backgrounds"

CHARACTER_ASSETS = [
    {
        "source": "main-character-idle-transparent-clean.webp",
        "gif": "main-character-idle.gif",
        "output": "main-character-idle-transparent-clean-optimized.webp",
    },
    {
        "source": "master-verion-idle-transparent-clean.webp",
        "gif": "master-verion-idle.gif",
        "output": "master-verion-idle-transparent-clean-optimized.webp",
    },
    {
        "source": "timedust-transparent-clean.webp",
        "gif": "timedust.gif",
        "output": "timedust-transparent-clean-optimized.webp",
    },
    {
        "source": "echo-trick-transparent-clean.webp",
        "gif": "echo-trick.gif",
        "output": "echo-trick-transparent-clean-optimized.webp",
    },
]


def gif_durations(asset):
    gif_path = CHARACTER_DIR / asset["gif"]
    if not gif_path.exists():
        return None
    with Image.open(gif_path) as gif:
        return [frame.info.get("duration", gif.info.get("duration", 40)) for frame in ImageSequence.Iterator(gif)]


def optimize_character(asset, target_width=360):
    source_path = CHARACTER_DIR / asset["source"]
    output_path = CHARACTER_DIR / asset["output"]
    source_durations = gif_durations(asset)

    with Image.open(source_path) as source:
        source_frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]

    if source_durations and len(source_durations) == len(source_frames):
        durations = source_durations
    else:
        durations = [40] * len(source_frames)

    optimized_frames = []
    optimized_durations = []
    index = 0
    while index < len(source_frames):
        frame = source_frames[index]
        base_duration = durations[index]
        step = 2 if base_duration <= 50 else 1
        frame_duration = sum(durations[index : min(index + step, len(durations))])

        ratio = target_width / frame.width
        target_size = (target_width, max(1, round(frame.height * ratio)))
        optimized_frames.append(frame.resize(target_size, Image.Resampling.LANCZOS))
        optimized_durations.append(frame_duration)
        index += step

    optimized_frames[0].save(
        output_path,
        save_all=True,
        append_images=optimized_frames[1:],
        duration=optimized_durations,
        loop=0,
        format="WEBP",
        quality=82,
        alpha_quality=100,
        method=4,
        exact=True,
    )
    return len(source_frames), len(optimized_frames), source_frames[0].size, optimized_frames[0].size


def make_static_background():
    source_path = BACKGROUND_DIR / "grammar-hall-animated.gif"
    output_path = BACKGROUND_DIR / "grammar-hall-static.webp"
    with Image.open(source_path) as source:
        frame = next(ImageSequence.Iterator(source)).convert("RGB")
        frame.save(output_path, format="WEBP", quality=86, method=4)
    return output_path


def main():
    for asset in CHARACTER_ASSETS:
        original_count, optimized_count, original_size, optimized_size = optimize_character(asset)
        output = CHARACTER_DIR / asset["output"]
        print(
            f"{asset['source']} -> {asset['output']}: "
            f"{original_count} frames {original_size} to {optimized_count} frames {optimized_size}, "
            f"{output.stat().st_size / 1024 / 1024:.2f} MB"
        )
    background = make_static_background()
    print(f"grammar-hall-animated.gif -> {background.name}: {background.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
