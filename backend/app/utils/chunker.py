from typing import List


def chunk_text(text: str, max_tokens: int = 5000, overlap_words: int = 200) -> List[str]:
    """Split text into overlapping chunks for processing large documents."""
    words = text.split()
    if len(words) <= max_tokens:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_tokens, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap_words

    return chunks
