#!/usr/bin/env python3
import argparse
import sys
import os
from pathlib import Path

# Ensure project root is on sys.path so we can import video_tools.py
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from video_tools import generate_video_with_sora

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prompt', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--duration', type=int, default=10)
    parser.add_argument('--aspect', default=None)
    parser.add_argument('--width', type=int, default=None)
    parser.add_argument('--height', type=int, default=None)
    parser.add_argument('--variants', type=int, default=1)
    parser.add_argument('--model', default='sora')
    args = parser.parse_args()
    path = generate_video_with_sora(
        prompt=args.prompt,
        out_path=args.out,
        duration_seconds=args.duration,
        aspect_ratio=args.aspect,
        width=args.width,
        height=args.height,
        n_variants=args.variants,
        model=args.model,
    )
    sys.stdout.write(path)

if __name__ == '__main__':
    main() 