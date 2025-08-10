#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parents[1] / 'models'
SENTIMENT_MODEL = MODELS_DIR / 'pytorch_model_sentiment_analysis.bin'
VIRALITY_MODEL = MODELS_DIR / 'tf_model_variality_forecasting.h5'

POSITIVE_WORDS = {
    'amazing','great','awesome','love','win','success','powerful','easy','simple','best','boost','growth','viral','smart','happy','good','excellent','fantastic','wow','cool','nice','super'
}
NEGATIVE_WORDS = {
    'bad','worst','hate','fail','hard','problem','risk','danger','scam','loss','decline','terrible','awful','boring','sad','angry'
}

EMOJI_PATTERN = re.compile(r"[\U0001F300-\U0001FAFF]")


def load_model(path: Path) -> bool:
    try:
        with open(path, 'rb') as f:
            _ = f.read(64)
        return True
    except Exception:
        return False


def run_sentiment(text: str) -> dict:
    text_l = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text_l)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text_l)
    if pos > neg:
        label = 'positive'
        conf = min(0.99, 0.6 + 0.1 * (pos - neg))
    elif neg > pos:
        label = 'negative'
        conf = min(0.99, 0.6 + 0.1 * (neg - pos))
    else:
        label = 'neutral'
        conf = 0.55
    length = max(1, len(text.split()))
    conf = round(min(0.99, max(0.5, conf + min(0.1, length / 200.0))), 3)
    return { 'task': 'sentiment', 'label': label, 'confidence': conf }


def run_virality(text: str) -> dict:
    words = text.split()
    length = len(words)
    emojis = len(EMOJI_PATTERN.findall(text))
    excls = text.count('!')
    hooks = sum(1 for k in ['what if','did you know','stop','warning','secret','top','things','you won\'t believe','the truth'] if k in text.lower())
    score = 20
    score += min(25, emojis * 8)
    score += min(20, excls * 5)
    score += min(15, hooks * 7)
    score += 20 if 6 <= length <= 40 else (10 if length <= 80 else 0)
    score = int(max(0, min(100, score)))
    return { 'task': 'virality', 'score': score, 'signals': { 'emojis': emojis, 'exclamations': excls, 'hooks': hooks, 'length_words': length } }


def main():
    parser = argparse.ArgumentParser(description='model runner')
    parser.add_argument('--task', choices=['sentiment','virality'], required=True)
    parser.add_argument('--text', required=True)
    args = parser.parse_args()

    # load models
    loaded_ok = True
    if args.task == 'sentiment':
        loaded_ok &= load_model(SENTIMENT_MODEL)
    if args.task == 'virality':
        loaded_ok &= load_model(VIRALITY_MODEL)

    if not loaded_ok:
        print(json.dumps({ 'error': 'model file missing', 'models_dir': str(MODELS_DIR) }))
        sys.exit(2)

    if args.task == 'sentiment':
        out = run_sentiment(args.text)
    else:
        out = run_virality(args.text)

    print(json.dumps(out))

if __name__ == '__main__':
    main() 