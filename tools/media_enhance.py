from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".webm"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Best-effort enhancer for unintentionally blurry images and videos."
    )
    parser.add_argument("input", type=Path, help="Input image or video path")
    parser.add_argument("-o", "--output", type=Path, help="Output path")
    parser.add_argument(
        "--mode",
        choices=["auto", "image", "video"],
        default="auto",
        help="Force media type detection",
    )
    parser.add_argument(
        "--roi",
        type=str,
        help="Optional region of interest as x,y,width,height",
    )
    parser.add_argument(
        "--psf-size",
        type=int,
        default=5,
        help="Gaussian PSF kernel size for deblur stage",
    )
    parser.add_argument(
        "--psf-sigma",
        type=float,
        default=1.2,
        help="Gaussian PSF sigma for deblur stage",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=10,
        help="Richardson-Lucy iterations",
    )
    parser.add_argument(
        "--deblur-blend",
        type=float,
        default=0.45,
        help="Blend between original luminance and deblurred luminance",
    )
    parser.add_argument(
        "--amount",
        type=float,
        default=1.1,
        help="Unsharp mask amount",
    )
    parser.add_argument(
        "--radius",
        type=float,
        default=1.3,
        help="Unsharp mask Gaussian sigma",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.02,
        help="Edge threshold for unsharp mask in normalized luminance units",
    )
    parser.add_argument(
        "--denoise",
        type=float,
        default=18.0,
        help="Bilateral denoise strength for blocking and compression artifacts",
    )
    return parser.parse_args()


def detect_mode(input_path: Path, forced_mode: str) -> str:
    if forced_mode != "auto":
        return forced_mode
    suffix = input_path.suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    raise ValueError(f"Unsupported input type for {input_path}")


def default_output_path(input_path: Path, mode: str) -> Path:
    stem = f"{input_path.stem}_enhanced"
    return input_path.with_name(f"{stem}{input_path.suffix}") if mode == "image" else input_path.with_name(f"{stem}.mp4")


def parse_roi(roi: str | None, width: int, height: int) -> tuple[int, int, int, int] | None:
    if not roi:
        return None
    try:
        x_str, y_str, w_str, h_str = roi.split(",")
        x, y, w, h = int(x_str), int(y_str), int(w_str), int(h_str)
    except ValueError as exc:
        raise ValueError("ROI must have format x,y,width,height") from exc

    if w <= 0 or h <= 0:
        raise ValueError("ROI width and height must be positive")

    x = max(0, min(x, width - 1))
    y = max(0, min(y, height - 1))
    w = min(w, width - x)
    h = min(h, height - y)
    return x, y, w, h


def gaussian_psf(size: int, sigma: float) -> np.ndarray:
    size = max(3, size | 1)
    kernel_1d = cv2.getGaussianKernel(size, sigma)
    kernel_2d = kernel_1d @ kernel_1d.T
    kernel_2d /= np.sum(kernel_2d)
    return kernel_2d.astype(np.float32)


def richardson_lucy(image: np.ndarray, psf: np.ndarray, iterations: int) -> np.ndarray:
    estimate = np.clip(image.copy(), 1e-4, 1.0)
    psf_mirror = np.flip(psf)

    for _ in range(max(1, iterations)):
        conv = cv2.filter2D(estimate, -1, psf, borderType=cv2.BORDER_REFLECT)
        relative_blur = image / np.maximum(conv, 1e-4)
        estimate *= cv2.filter2D(relative_blur, -1, psf_mirror, borderType=cv2.BORDER_REFLECT)
        estimate = np.clip(estimate, 0.0, 1.0)

    return estimate


def unsharp_mask(image: np.ndarray, amount: float, sigma: float, threshold: float) -> np.ndarray:
    blurred = cv2.GaussianBlur(image, (0, 0), sigmaX=sigma, sigmaY=sigma)
    sharpened = image * (1.0 + amount) - blurred * amount
    if threshold > 0:
        low_contrast_mask = np.abs(image - blurred) < threshold
        sharpened = np.where(low_contrast_mask, image, sharpened)
    return np.clip(sharpened, 0.0, 1.0)


def enhance_luminance(channel: np.ndarray, args: argparse.Namespace) -> np.ndarray:
    normalized = np.clip(channel.astype(np.float32) / 255.0, 0.0, 1.0)

    if args.denoise > 0:
        denoised = cv2.bilateralFilter(
            normalized,
            d=5,
            sigmaColor=args.denoise / 255.0,
            sigmaSpace=3,
        )
    else:
        denoised = normalized

    psf = gaussian_psf(args.psf_size, args.psf_sigma)
    deblurred = richardson_lucy(denoised, psf, args.iterations)
    mixed = cv2.addWeighted(
        normalized,
        max(0.0, min(1.0, 1.0 - args.deblur_blend)),
        deblurred,
        max(0.0, min(1.0, args.deblur_blend)),
        0,
    )
    sharpened = unsharp_mask(mixed, args.amount, args.radius, args.threshold)
    return np.clip(sharpened * 255.0, 0.0, 255.0).astype(np.uint8)


def enhance_region(region: np.ndarray, args: argparse.Namespace) -> np.ndarray:
    if region.ndim == 2:
        return enhance_luminance(region, args)

    if region.shape[2] == 4:
        color = region[:, :, :3]
        alpha = region[:, :, 3:4]
    else:
        color = region
        alpha = None

    lab = cv2.cvtColor(color, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    enhanced_l = enhance_luminance(l_channel, args)
    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    if alpha is None:
        return enhanced_bgr
    return np.concatenate([enhanced_bgr, alpha], axis=2)


def enhance_frame(frame: np.ndarray, args: argparse.Namespace) -> np.ndarray:
    height, width = frame.shape[:2]
    roi = parse_roi(args.roi, width, height)
    result = frame.copy()

    if roi is None:
        return enhance_region(result, args)

    x, y, w, h = roi
    result[y : y + h, x : x + w] = enhance_region(result[y : y + h, x : x + w], args)
    return result


def process_image(input_path: Path, output_path: Path, args: argparse.Namespace) -> None:
    image = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError(f"Could not load image: {input_path}")

    enhanced = enhance_frame(image, args)
    if not cv2.imwrite(str(output_path), enhanced):
        raise ValueError(f"Could not save image: {output_path}")


def select_fourcc(output_path: Path) -> int:
    suffix = output_path.suffix.lower()
    if suffix in {".avi"}:
        return cv2.VideoWriter_fourcc(*"XVID")
    return cv2.VideoWriter_fourcc(*"mp4v")


def process_video(input_path: Path, output_path: Path, args: argparse.Namespace) -> None:
    capture = cv2.VideoCapture(str(input_path))
    if not capture.isOpened():
        raise ValueError(f"Could not open video: {input_path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    writer = cv2.VideoWriter(
        str(output_path),
        select_fourcc(output_path),
        fps,
        (width, height),
    )
    if not writer.isOpened():
        capture.release()
        raise ValueError(f"Could not create video writer: {output_path}")

    processed = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            writer.write(enhance_frame(frame, args))
            processed += 1
            if processed % 10 == 0:
                total = frame_count if frame_count > 0 else "?"
                print(f"Processed {processed}/{total} frames", flush=True)
    finally:
        capture.release()
        writer.release()


def main() -> None:
    args = parse_args()
    input_path = args.input.expanduser().resolve()
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    mode = detect_mode(input_path, args.mode)
    output_path = args.output.expanduser().resolve() if args.output else default_output_path(input_path, mode)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if mode == "image":
        process_image(input_path, output_path, args)
    else:
        process_video(input_path, output_path, args)

    print(f"Saved enhanced {mode} to {output_path}")


if __name__ == "__main__":
    main()