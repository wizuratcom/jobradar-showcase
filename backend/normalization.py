"""Text-only normalizer adapted from the private JobRadar backend."""

import html
import re


def normalize_description(value: str) -> str:
    text = value.strip()
    for _ in range(2):
        decoded = html.unescape(text)
        if decoded == text:
            break
        text = decoded
    text = re.sub(
        r"<(?:script|style)\b[^>]*>.*?</(?:script|style)\s*>", "", text, flags=re.I | re.S
    )
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</?\s*(?:p|div|li|h[1-6])\b[^>]*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()
